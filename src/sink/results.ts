import {StoredMessage} from "./interface";

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

export interface Error {
    message: StoredMessage;
    error: string;
}

export type ErrorListResult = ListResult<Error>;
export type RetrieveResult = ListResult<StoredMessage>;
