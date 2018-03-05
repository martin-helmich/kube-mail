import {ForwardPolicy} from "../policy/provider";
import * as SMTPConnection from "nodemailer/lib/smtp-connection";
import {AuthenticationCredentials, Envelope, SentMessageInfo} from "nodemailer/lib/smtp-connection";
import {SMTPServerEnvelope} from "smtp-server";

export interface SMTPUpstreamOptions {
    name: string;
    connectionTimeout?: number;
    socketTimeout?: number;
}

const debug = require("debug")("upstream:smtp");
const defaultOptions: SMTPUpstreamOptions = {
    name: "kubemail.local"
};

export class SMTPUpstream {

    private options: SMTPUpstreamOptions;

    public constructor(options: Partial<SMTPUpstreamOptions> = {}) {
        this.options = {...defaultOptions, ...options};
    }

    public async forward(policy: ForwardPolicy, envelope: SMTPServerEnvelope, message: Buffer): Promise<void> {
        const {auth} = policy.smtp;
        const {mailFrom} = envelope;

        if (!mailFrom) {
            throw new Error("incomplete envelope")
        }

        const conn = await this.connectionForPolicy(policy);

        if (auth) {
            debug("authenticating as %o", auth.username);
            await conn.login({
                credentials: {
                    user: auth.username,
                    pass: auth.password,
                }
            })
        }

        debug("sending message");

        await conn.send({
            from: mailFrom.address,
            to: envelope.rcptTo.map(r => r.address),
        }, message);

        debug("message sent");
    }

    private connectionForPolicy(policy: ForwardPolicy): Promise<PromisifiedSMTPConnection> {
        const {server, port, tls, auth} = policy.smtp;
        const {name, connectionTimeout, socketTimeout} = this.options;

        debug("connecting to SMTP server %o, port %o", server, port);

        const conn = new SMTPConnection({
            host: server,
            port: port,
            secure: tls,
            name,
            connectionTimeout,
            socketTimeout,
            authMethod: auth ? auth.method : undefined,
        });

        return new Promise((res, rej) => {
            conn.on("error", err => {
                debug("error on connection: %o", err);
                rej(err);
            });

            conn.connect(() => {
                debug("connection established");
                res(new PromisifiedSMTPConnection(conn));
            });
        });
    }

}

class PromisifiedSMTPConnection {

    public constructor(private inner: SMTPConnection) {
    }

    public login(auth: AuthenticationCredentials): Promise<void> {
        return new Promise((res, rej) => {
            this.inner.login(auth, err => {
                err ? rej(err) : res();
            });
        });
    }

    public send(envelope: Envelope, message: Buffer): Promise<SentMessageInfo> {
        return new Promise((res, rej) => {
            this.inner.send(envelope, message, (err, info) => {
                if (err) {
                    rej(err);
                    return;
                }

                res(info);
            });
        })
    }

}