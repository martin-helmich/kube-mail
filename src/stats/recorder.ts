import {Policy} from "../policy/provider";
import {Counter, Registry} from "prom-client";

export class PrometheusRecorder implements StatisticsRecorder {
    private messageCount: Counter<any>;
    private rejectedCount: Counter<any>;
    private rejectedNoPodCount: Counter<any>;
    private errorCount: Counter<any>;

    public constructor(register: Registry) {
        this.messageCount = new Counter({
            name: "kubemail_received_emails",
            help: "amount of received emails",
            labelNames: ["pod_namespace", "pod_name", "policy_namespace", "policy_name", "server_namespace", "server_name"],
            registers: [register],
        });
        this.rejectedCount = new Counter({
            name: "kubemail_rejected_emails_nopolicy",
            help: "amount of emails rejected due to a missing policy",
            labelNames: ["pod_namespace", "pod_name"],
            registers: [register],
        });
        this.rejectedNoPodCount = new Counter({
            name: "kubemail_rejected_emails_nopod",
            help: "amount of emails rejected due to not originating from a known Pod IP",
            labelNames: [],
            registers: [register],
        });
        this.errorCount = new Counter({
            name: "kubemail_forward_errors",
            help: "amount of errors while forwarding emails to upstream SMTP servers",
            labelNames: ["pod_namespace", "pod_name", "policy_namespace", "policy_name", "server_namespace", "server_name"],
            registers: [register],
        });
    }

    public async observeSent(policy: Policy, sender: string, recipients: string[]): Promise<void> {
        this.messageCount.labels(
            policy.sourceReference.namespace,
            policy.sourceReference.podName,
            policy.namespace,
            policy.name,
            policy.smtp.namespace,
            policy.smtp.name,
        ).inc(recipients.length);
    }

    public async observeError(policy: Policy, sender: string): Promise<void> {
        this.errorCount.labels(
            policy.sourceReference.namespace,
            policy.sourceReference.podName,
            policy.namespace,
            policy.name,
            policy.smtp.namespace,
            policy.smtp.name
        ).inc(1);
    }

    public async observeRejectedNoPolicy(podNamespace: string | undefined, podName: string | undefined): Promise<void> {
        if (podNamespace && podName) {
            this.rejectedCount.labels(podNamespace, podName).inc(1);
        } else {
            this.rejectedNoPodCount.inc(1);
        }
    }

}

export interface StatisticsRecorder {
    observeSent(policy: Policy, sender: string, recipients: string[]): Promise<void>;
    observeRejectedNoPolicy(podNamespace: string | undefined, podName: string | undefined): Promise<void>;
    observeError(policy: Policy, sender: string): Promise<void>;
}
