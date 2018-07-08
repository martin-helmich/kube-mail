import {SMTPServerAuthentication, SMTPServerAuthenticationResponse, SMTPServerSession} from "smtp-server";
import {Readable} from "stream";
import {Policy, PolicyProvider} from "./policy/provider";
import {Parser, Sink} from "./sink/interface";
import {readStreamIntoBuffer} from "./util";
import {SMTPUpstream} from "./upstream/smtp";
import {StatisticsRecorder} from "./stats/recorder";

const debug = require("debug")("backend");

export interface ExtendedSMTPServerSession extends SMTPServerSession {
    policy?: Policy;
}

export class SMTPBackend {

    public constructor(private policyProvider: PolicyProvider,
                       private parser: Parser,
                       private recorder: StatisticsRecorder,
                       private sink: Sink,
                       private upstream: SMTPUpstream) {
    }

    public handleAuthentication(auth: SMTPServerAuthentication, session: ExtendedSMTPServerSession, callback: (err: Error | null | undefined, response: SMTPServerAuthenticationResponse) => void): void {
        debug("handling authentication: %o, %o", auth, session);
        callback(undefined, {user: "martin"});
    }

    public async onConnect(session: ExtendedSMTPServerSession, callback: (err?: Error | null) => void) {
        debug("connection attempt by %s", session.remoteAddress);
        const policy = await this.policyProvider.getByClientIP(session.remoteAddress);

        if (!policy) {
            debug("rejection connection; no policy found");
            callback(new Error("access forbidden by policy"));
            return;
        }

        session.policy = policy;

        debug("connecting %o", session);
        callback(undefined);
    }

    public async onData(stream: Readable, session: ExtendedSMTPServerSession, callback: (err?: Error | null) => void) {
        const {policy, remoteAddress, envelope} = session;
        if (!policy) {
            callback(new Error("access forbidden by policy"));
            return;
        }

        debug("receiving message: %o", session);

        const {mailFrom, rcptTo} = envelope;
        if (!mailFrom || !rcptTo) {
            callback(new Error("incomplete envelope"));
            return;
        }

        try {
            const buf = await readStreamIntoBuffer(stream);

            if (policy.type === "catch") {
                const msg = await this.parser.parseMessage(session, buf);

                msg.remoteAddress = remoteAddress;

                debug("parsed message: %O", msg);

                callback();

                await this.sink.storeMessage(policy.sourceReference, msg, policy);
            } else {
                // noinspection JSIgnoredPromiseFromCall
                this.recorder.observe(policy, mailFrom.address, rcptTo.map(r => r.address));

                await this.upstream.forward(policy, envelope, buf);
                callback();
            }
        } catch (err) {
            callback(err);
        }
    }

}