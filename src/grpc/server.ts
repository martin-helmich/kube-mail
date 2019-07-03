import {Server, ServerCredentials, ServerUnaryCall, ServerWriteableStream, ServiceError, status} from "grpc";
import {Email, GetCaughtEmailRequest, GetSummaryRequest, ListCaughtEmailsRequest, ListCaughtEmailsResponse, Summary, WatchCaughtEmailsRequest} from "./proto/service_pb";
import {RealtimeSink, Sink} from "../sink/interface";
import {StatisticsRecorder} from "../stats/recorder";
import {mapMessage} from "./mapping";
import Item = Summary.Item;

const debug = require("debug")("kubemail:grpc");
const service = require("./proto/service_grpc_pb");

export interface GRPCServerOptions {
    sink: Sink;
    recorder: StatisticsRecorder;
}

export class GRPCServer {

    private sink: Sink;
    private recorder: StatisticsRecorder;

    public constructor(opts: GRPCServerOptions) {
        this.sink = opts.sink;
        this.recorder = opts.recorder;
    }

    public listen(port: number) {
        const addr = "0.0.0.0:" + port;
        const server = new Server();

        server.addService(service.KubeMailService, {
            getSummary: async (call: ServerUnaryCall<GetSummaryRequest>, cb: (err: ServiceError | null, res: Summary | null) => any): Promise<void> => {
                const namespace = call.request.getNamespace();
                const fromTimestamp = call.request.getFromTimestamp();
                const from = fromTimestamp ? new Date(fromTimestamp * 1000) : new Date(new Date().getTime() - 86400000);

                if (!namespace) {
                    return cb({code: status.INVALID_ARGUMENT, name: "MissingArgument", message: "you must supply a 'namespace' argument"}, null);
                }

                const report = await this.recorder.summarize({namespace, from}, {});
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

            listCaughtEmails: async (call: ServerUnaryCall<ListCaughtEmailsRequest>, cb: (err: ServiceError | null, res: ListCaughtEmailsResponse | null) => any): Promise<void> => {
                const limit = call.request.getLimit() || 100;
                const offset = call.request.getOffset() || 0;
                const namespace = call.request.getNamespace();

                if (!namespace) {
                    return cb({code: status.INVALID_ARGUMENT, name: "MissingArgument", message: "you must supply a 'namespace' argument"}, null);
                }

                const result = await this.sink.retrieveMessages({namespace}, {limit, offset});
                const response = new ListCaughtEmailsResponse();

                response.setLimit(limit);
                response.setOffset(offset);
                response.setTotalCount(result.totalCount);
                response.setEmailList(result.messages.map(mapMessage));

                cb(null, response);
            },

            getCaughtEmail: async (call: ServerUnaryCall<GetCaughtEmailRequest>, cb: (err: ServiceError | null, res: Email | null) => any): Promise<void> => {
                const namespace = call.request.getNamespace();
                const emailID = call.request.getId();

                if (!namespace) {
                    return cb({code: status.INVALID_ARGUMENT, name: "MissingArgument", message: "you must supply a 'namespace' argument"}, null)
                }

                if (!emailID) {
                    return cb({code: status.INVALID_ARGUMENT, name: "MissingArgument", message: "you must supply a 'id' argument"}, null)
                }

                const result = await this.sink.retrieveMessages({id: emailID, namespace});
                if (result.messages.length < 1) {
                    return cb({code: status.NOT_FOUND, name: "NotFound", message: "message with given ID not found"}, null);
                }

                const mapped = mapMessage(result.messages[0]);
                cb(null, mapped);
            },

            watchCaughtEmails: (call: ServerWriteableStream<WatchCaughtEmailsRequest>): void => {
                const namespace = call.request.getNamespace();
                const onlyNew = call.request.getOnlyNew();

                if (!namespace) {
                    call.emit("error", {code: status.INVALID_ARGUMENT, name: "MissingArgument", message: "you must supply a 'namespace' argument"});
                    return;
                }

                debug("streaming messages for namespace %o", namespace);

                if (!("retrieveMessageStream" in this.sink)) {
                    return;
                }

                const stream = (this.sink as RealtimeSink).retrieveMessageStream({namespace}, {onlyNew});

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
                    call.emit("error", {code: status.INTERNAL, name: "InternalError", message: "an error occurred while streaming messages"});
                })
            },
        });

        debug("starting GRPC server at %o", addr);

        server.bind(addr, ServerCredentials.createInsecure());
        server.start();
    }

}