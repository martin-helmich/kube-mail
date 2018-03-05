import {SMTPServerSession} from "smtp-server";
import {ParsedMail} from "mailparser";
import {SourceReference} from "../policy/provider";
import {TypedStream} from "../util";

export interface Message {
    envelope: {
        mailFrom: string;
        rcptTo: string[];
    };

    date: Date;
    mail: ParsedMail;
    ownershipLabels?: {[k: string]: string};
    remoteAddress?: string;
}

export interface RetrieveOptions {
    limit?: number;
    offset?: number;
}

export interface RetrieveResult {
    messages: Message[];
    totalCount: number;
}

export interface Parser {
    parseMessage(session: SMTPServerSession, data: Buffer): Promise<Message>
}

export interface Sink {
    setup?(): Promise<void>;

    storeMessage(source: SourceReference, message: Message): Promise<void>
    retrieveMessages(source: SourceReference, opts?: RetrieveOptions): Promise<RetrieveResult>
}