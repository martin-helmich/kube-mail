import {Server, ServerCredentials, ServerUnaryCall, ServerWriteableStream, ServiceError} from "grpc";
import {
    GetSummaryRequest,
    ListCaughtEmailsRequest,
    ListCaughtEmailsResponse, ListErrorsRequest, ListErrorsResponse,
    Summary,
    WatchCaughtEmailsRequest
} from "./proto/service_pb";
import {RealtimeSink, Sink} from "../sink/interface";
import {mapError, mapMessage} from "./mapping";
import Item = Summary.Item;
import * as _ from "lodash";

const debug = require("debug")("kubemail:grpc");
const service = require("./proto/service_grpc_pb");

export interface GRPCServerOptions {
    sink: Sink;
}

export class GRPCServer {

    private sink: Sink;

    public constructor(opts: GRPCServerOptions) {
        this.sink = opts.sink;
    }

    public listen(port: number) {
        const addr = "0.0.0.0:" + port;
        const server = new Server();

        server.addService(service.KubeMailService, {
            getSummary: async (call: ServerUnaryCall<GetSummaryRequest>, cb: (err: ServiceError|null, res: Summary|null) => any): Promise<void> => {
                const namespace = call.request.getNamespace();
                const fromTimestamp = call.request.getFromTimestamp();
                const from = fromTimestamp ? new Date(fromTimestamp * 1000) : new Date(new Date().getTime() - 86400000);

                if (!namespace) {
                    return cb({name: "MissingArgument", message: "you must supply a 'namespace' argument"}, null);
                }

                const report = await this.sink.retrieveForwardingSummary({namespace, from});
                const result = new Summary();

                result.setItemList(report.messagesOverTime.map(moi => {
                    const item = new Item();

                    item.setTimestamp(moi.time);
                    item.setMessageCount(moi.count);

                    return item;
                }));

                const rm = result.getRecipientMap();
                const sm = result.getSenderMap();

                for (const recipient of Object.keys(report.recipients)) {
                    rm.set(recipient, report.recipients[recipient]);
                }

                for (const sender of Object.keys(report.senders)) {
                    sm.set(sender, report.senders[sender]);
                }

                debug("original summary: %o", report);
                debug("sending summary %o", result.toObject());

                cb(null, result);
            },

            listCaughtEmails: async (call: ServerUnaryCall<ListCaughtEmailsRequest>, cb: (err: ServiceError|null, res: ListCaughtEmailsResponse|null) => any): Promise<void> => {
                const limit = call.request.getLimit() || 100;
                const offset = call.request.getOffset() || 0;
                const namespace = call.request.getNamespace();

                if (!namespace) {
                    return cb({
                        name: "MissingArgument",
                        message: "you must supply a 'namespace' argument"
                    }, null);
                }

                const result = await this.sink.retrieveCaughtMessages({namespace}, {limit, offset});
                const response = new ListCaughtEmailsResponse();

                response.setLimit(limit);
                response.setOffset(offset);
                response.setTotalCount(result.totalCount);
                response.setEmailList(result.items.map(mapMessage));

                cb(null, response);
            },

            watchCaughtEmails: (call: ServerWriteableStream<WatchCaughtEmailsRequest>): void => {
                const namespace = call.request.getNamespace();
                const onlyNew = call.request.getOnlyNew();

                if (!namespace) {
                    call.emit("error", {
                        name: "MissingArgument",
                        message: "you must supply a 'namespace' argument"
                    });
                    return;
                }

                debug("streaming messages for namespace %o", namespace);

                if (!("retrieveMessageStream" in this.sink)) {
                    return;
                }

                const stream = (this.sink as RealtimeSink).retrieveCaughtMessageStream({namespace}, {onlyNew});

                stream.on("data", msg => {
                    const mapped = mapMessage(msg);
                    debug("pushing message %o (orig %o) to stream", mapped, msg);

                    call.write(mapped);
                });

                stream.on("end", () => {
                    debug("stream has ended");

                    call.end();
                });

                stream.on("error", (err: Error) => {
                    debug("error while streaming: %o", err);
                    call.emit("error", {
                        name: "InternalError",
                        message: "an error occurred while streaming messages"
                    });
                })
            },

            listErrors: async (call: ServerUnaryCall<ListErrorsRequest>, cb: (err: ServiceError|null, res: ListErrorsResponse|null) => any): Promise<void> => {
                const limit = call.request.getLimit() || 100;
                const offset = call.request.getOffset() || 0;
                const namespace = call.request.getNamespace();
                const labelSelectorMap = call.request.getLabelSelectorMap();
                const labelSelector = _.fromPairs(labelSelectorMap.toArray());

                if (!namespace) {
                    return cb({
                        name: "MissingArgument",
                        message: "you must supply a 'namespace' argument"
                    }, null);
                }

                const result = await this.sink.retrieveErrors({namespace, labelSelector}, {limit, offset});
                const response = new ListErrorsResponse();

                response.setLimit(limit);
                response.setOffset(offset);
                response.setTotalCount(result.totalCount);
                response.setErrorList(result.items.map(mapError));

                cb(null, response);
            }
        });

        debug("starting GRPC server at %o", addr);

        server.bind(addr, ServerCredentials.createInsecure());
        server.start();
    }

}