import {SMTPServerAuthentication, SMTPServerAuthenticationResponse, SMTPServerSession} from "smtp-server";
import {Readable} from "stream";
import {Policy, PolicyProvider} from "./policy/provider";
import {readStreamIntoBuffer} from "./util";
import {SMTPUpstream} from "./upstream/smtp";
import {StatisticsRecorder} from "./stats/recorder";

const debug = require("debug")("backend");

export interface ExtendedSMTPServerSession extends SMTPServerSession {
    policy?: Policy;
}

export class SMTPBackend {

    public constructor(private policyProvider: PolicyProvider,
                       private recorder: StatisticsRecorder,
                       private upstream: SMTPUpstream) {
    }

    public handleAuthentication(auth: SMTPServerAuthentication, session: ExtendedSMTPServerSession, callback: (err: Error | null | undefined, response: SMTPServerAuthenticationResponse) => void): void {
        debug("handling authentication: %o, %o", auth, session);
        callback(undefined, {user: "martin"});
    }

    public async onConnect(session: ExtendedSMTPServerSession, callback: (err?: Error | null) => void) {
        debug("connection attempt by %s", session.remoteAddress);
        const [policy, pod] = await this.policyProvider.getByClientIP(session.remoteAddress);

        if (!policy) {
            // noinspection JSIgnoredPromiseFromCall,ES6MissingAwait
            this.recorder.observeRejectedNoPolicy(pod?.metadata.namespace, pod?.metadata.name);

            debug("rejection connection; no policy found");
            callback(new Error("access forbidden by policy"));
            return;
        }

        session.policy = policy;

        debug("connecting %o", session);
        callback(undefined);
    }

    public async onData(stream: Readable, session: ExtendedSMTPServerSession, callback: (err?: Error | null) => void) {
        const {policy, envelope} = session;
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

            await this.upstream.forward(policy, envelope, buf);

            // noinspection JSIgnoredPromiseFromCall,ES6MissingAwait
            this.recorder.observeSent(policy, mailFrom.address, rcptTo.map(r => r.address));

            callback();
        } catch (err) {
            // noinspection JSIgnoredPromiseFromCall,ES6MissingAwait
            this.recorder.observeError(policy, mailFrom.address);
            callback(err);
        }
    }

}
