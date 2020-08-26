import {Policy} from "../policy/provider";
import {Counter, Registry} from "prom-client";

export class PrometheusRecorder implements StatisticsRecorder {
    private messageCount: Counter<any>;

    public constructor(register: Registry) {
        this.messageCount = new Counter({
            name: "kubemail_received_emails",
            help: "amount of received emails",
            labelNames: ["policy", "server"],
            registers: [register],
        })
    }

    public async observe(policy: Policy, sender: string, recipients: string[]): Promise<void> {
        this.messageCount.labels(policy.id, policy.smtp.name).inc(recipients.length);
    }

}

export interface StatisticsRecorder {
    observe(policy: Policy, sender: string, recipients: string[]): Promise<void>;
}
