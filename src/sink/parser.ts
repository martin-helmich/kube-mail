import {Message, Parser} from "./interface";
import {SMTPServerSession} from "smtp-server";
import {simpleParser} from "mailparser";

export class ParserImpl implements Parser {

    public async parseMessage(session: SMTPServerSession, data: Buffer): Promise<Message> {
        const {mailFrom, rcptTo} = session.envelope;
        if (!mailFrom || !rcptTo) {
            throw new Error("incomplete envelope");
        }

        const mail = await simpleParser(data);
        const date = new Date();

        return {
            envelope: {
                mailFrom: mailFrom.address,
                rcptTo: rcptTo.map(r => r.address),
            },
            date,
            mail
        };
    }
}