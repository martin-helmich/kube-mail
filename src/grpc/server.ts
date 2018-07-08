import {Server, ServerCredentials, ServerUnaryCall, ServerWriteableStream, ServiceError} from "grpc";
import {Email, ListCaughtEmailsRequest, ListCaughtEmailsResponse} from "./proto/service_pb";
import {Sink} from "../sink/interface";
import {StatisticsRecorder} from "../stats/recorder";
import EmailEnvelope = Email.EmailEnvelope;
import EmailMessage = Email.EmailMessage;
import Content = Email.EmailMessage.Content;
import {EmailAddress} from "mailparser";
import {mapEmailAddressToString, mapEmailHeaders} from "./mapping";

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
                response.setEmailList(result.messages.map(m => {
                    const email = new Email();
                    const env = new EmailEnvelope();
                    const msg = new EmailMessage();
                    const msgBody = new Content();

                    env.setMailfrom(m.envelope.mailFrom);
                    env.setRcpttoList(m.envelope.rcptTo);

                    msgBody.setText(m.mail.text);
                    if (typeof m.mail.html === "string") {
                        msgBody.setHtml(m.mail.html);
                    }

                    msg.setSubject(m.mail.subject);
                    msg.setBody(msgBody);
                    msg.setToList(m.mail.to.value.map(mapEmailAddressToString));
                    msg.setFromList(m.mail.from.value.map(mapEmailAddressToString));

                    if (m.mail.cc) {
                        msg.setCcList(m.mail.cc.value.map(mapEmailAddressToString));
                    }

                    if (m.mail.bcc) {
                        msg.setBccList(m.mail.bcc.value.map(mapEmailAddressToString));
                    }

                    msg.setHeaderList(mapEmailHeaders(m.mail.headers));

                    email.setEnvelope(env);
                    email.setMessage(msg);
                    email.setDate(m.date.getDate());

                    return email;
                }));

                cb(null, response);
            },

            watchCaughtEmails(call: ServerWriteableStream<ListCaughtEmailsRequest>): void {

            },
        });

        debug("starting GRPC server at %o", addr);

        server.bind(addr, ServerCredentials.createInsecure());
        server.start();
    }

}