import {StoredError, StoredMessage} from "./interface";

export type ListResult<T> = {
    items: T[];
    totalCount: number;
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

export type ErrorListResult = ListResult<StoredError>;
export type RetrieveResult = ListResult<StoredMessage>;
