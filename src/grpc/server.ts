import {Server, ServerCredentials, ServerUnaryCall, ServerWriteableStream, ServiceError} from "grpc";
import {Email, ListCaughtEmailsRequest, ListCaughtEmailsResponse, WatchCaughtEmailsRequest} from "./proto/service_pb";
import {RealtimeSink, Sink} from "../sink/interface";
import {StatisticsRecorder} from "../stats/recorder";
import EmailEnvelope = Email.EmailEnvelope;
import EmailMessage = Email.EmailMessage;
import Content = Email.EmailMessage.Content;
import {EmailAddress} from "mailparser";
import {mapEmailAddressToString, mapEmailHeaders, mapMessage} from "./mapping";

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

                const result = await this.sink.retrieveMessages({namespace}, {limit, offset});
                const response = new ListCaughtEmailsResponse();

                response.setLimit(limit);
                response.setOffset(offset);
                response.setTotalcount(result.totalCount);
                response.setEmailList(result.messages.map(mapMessage));

                cb(null, response);
            },

            watchCaughtEmails: (call: ServerWriteableStream<WatchCaughtEmailsRequest>): void => {
                const namespace = call.request.getNamespace();
                const onlyNew = call.request.getOnlynew();

                if (!namespace) {
                    call.emit("error", {
                        name: "MissingArgument",
                        message: "you must supply a 'namespace' argument"
                    });
                    return;
                }

                if (!("retrieveMessageStream" in this.sink)) {
                    return;
                }

                const stream = (this.sink as RealtimeSink).retrieveMessageStream({namespace}, {onlyNew});

                stream.on("data", msg => {
                    call.write(mapMessage(msg));
                });

                stream.on("end", () => {
                    call.emit("end");
                });

                stream.on("error", (err: Error) => {
                    debug("error while streaming: %o", err);
                    call.emit("error", {
                        name: "InternalError",
                        message: "an error occurred while streaming messages"
                    });
                })
            },
        });

        debug("starting GRPC server at %o", addr);

        server.bind(addr, ServerCredentials.createInsecure());
        server.start();
    }

}