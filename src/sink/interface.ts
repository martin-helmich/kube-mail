import {SMTPServerSession} from "smtp-server";
import {ParsedMail} from "mailparser";
import {CatchPolicy, ForwardPolicy, SourceReference} from "../policy/provider";
import {TypedStream} from "../util";
import {RetrieveOptions, RetrieveStreamOptions} from "./options";
import {ErrorListResult, RetrieveResult, SummarizeResults} from "./results";

export interface Message {
    envelope: {
        mailFrom: string;
        rcptTo: string[];
    };

    date: Date;
    mail: ParsedMail;
    remoteAddress?: string;
}

export interface StoredMessage extends Message {
    id: string;
    source: SourceReference;
    expires?: Date;
}

export interface StoredError {
    id: string;
    source: SourceReference;

    message: Message;
    expires: Date;
    error: string;
}

export interface Query {
    namespace: string;
    podName?: string;
    labelSelector?: {[k: string]: string};
    from?: Date;
}

export interface Parser {
    parseMessage(session: SMTPServerSession, data: Buffer): Promise<Message>
}

export interface Sink {
    setup?(): Promise<void>;

    logCaughtMessage(source: SourceReference, message: Message, policy: CatchPolicy): Promise<void>;
    logForwardedMessage(source: SourceReference, message: Message, policy: ForwardPolicy): Promise<void>;
    logError(source: SourceReference, message: Message, error: string, policy: ForwardPolicy): Promise<void>;

    retrieveCaughtMessages(query: Query, opts?: RetrieveOptions): Promise<RetrieveResult>;
    retrieveForwardingSummary(query: Query): Promise<SummarizeResults>;
    retrieveErrors(query: Query, opts?: RetrieveOptions): Promise<ErrorListResult>;
}

export interface RealtimeSink extends Sink {
    retrieveCaughtMessageStream(query: Query, opts?: RetrieveStreamOptions): TypedStream<StoredMessage>;
}