import {Policy, SourceReference} from "../policy/provider";

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
    summarize(source: SourceReference, from: Date, opts: Partial<SummarizeOptions>): Promise<SummarizeResults>;
}