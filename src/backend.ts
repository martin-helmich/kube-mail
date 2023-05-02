import {SMTPServerAuthentication, SMTPServerAuthenticationResponse, SMTPServerSession} from "smtp-server";
import {Readable} from "stream";
import {Policy, PolicyProvider} from "./policy/provider";
import {readStreamIntoBuffer} from "./util";
import {SMTPUpstream} from "./upstream/smtp";
import {StatisticsRecorder} from "./stats/recorder";
import {RateLimiter} from "./ratelimit/ratelimiter";

const debug = require("debug")("backend");

export interface ExtendedSMTPServerSession extends SMTPServerSession {
    policy?: Policy;
}

export class SMTPBackend {
    private readonly policyProvider: PolicyProvider;
    private readonly recorder: StatisticsRecorder;
    private readonly rateLimiter: RateLimiter;
    private readonly upstream: SMTPUpstream;

    public constructor(
        policyProvider: PolicyProvider,
        recorder: StatisticsRecorder,
        rateLimiter: RateLimiter,
        upstream: SMTPUpstream,
    ) {
        this.policyProvider = policyProvider;
        this.recorder = recorder;
        this.rateLimiter = rateLimiter;
        this.upstream = upstream;
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

        debug("connection accepted %o", {id: session.id, policy: session.policy.name, pod: session.policy.sourceReference});
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

            if (policy.ratelimit) {
                debug("ratelimit is enabled for policy %o: %o", policy.id, policy.ratelimit);

                const ok = await this.rateLimiter.take(policy, rcptTo.length);
                if (!ok) {
                    const desc = `${policy.ratelimit.maximum} emails per ${policy.ratelimit.limitPeriod}`;

                    debug(`ratelimit (${desc}) is exceeded`);

                    // noinspection JSIgnoredPromiseFromCall,ES6MissingAwait
                    this.recorder.observeRejectedRatelimitExceeded(policy, mailFrom.address, rcptTo.map(r => r.address));

                    callback(new Error(`rate limit (${desc}) exceeded`));
                    return;
                }

                debug("ratelimit allows sending message");
            }

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
