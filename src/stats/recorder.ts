import {Policy} from "../policy/provider";

export interface Query {
    namespace: string;
    podName?: string;
    labelSelector?: {[k: string]: string};
    from: Date;
}

export interface SummarizeOptions {
    interval: string;
    timezone: string;
}

export interface SummaryItem {
    time: number;
    count: number;
}

export interface SummarizeResults {
    messagesOverTime: SummaryItem[];
    recipients: {[k: string]: number};
    senders: {[k: string]: number};
}

export const defaultSummarizeOptions: SummarizeOptions = {
    interval: "1m",
    timezone: "Europe/Berlin",
};

export interface StatisticsRecorder {
    setup?(): Promise<any>;
    observe(policy: Policy, sender: string, recipients: string[]): Promise<void>;
    summarize(query: Query, opts: Partial<SummarizeOptions>): Promise<SummarizeResults>;
}