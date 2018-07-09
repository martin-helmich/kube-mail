import {EmailAddress, Headers, HeaderValue} from "mailparser";
import {Email} from "./proto/service_pb";
import Header = Email.EmailMessage.Header;
import {Message} from "../sink/interface";
import EmailEnvelope = Email.EmailEnvelope;
import EmailMessage = Email.EmailMessage;
import Content = Email.EmailMessage.Content;

const makeHeader = (name: string, value: string): Header => {
    const header = new Header();

    header.setName(name);
    header.setValue(value);

    return header;
};

export const mapEmailAddressToString = (a: EmailAddress): string => {
    if (a.name && a.address) {
        return `${a.name} <${a.address}>`;
    }

    return a.address;
};

export const mapEmailHeaders = (a: Headers): Array<Header> => {
    const headers: Array<Header> = [];
    const fuck: {[k: string]: HeaderValue} = a as any;

    for (const m of Object.keys(a)) {
        const v = fuck[m];

        if (v === undefined) {
            continue;
        }

        if (typeof v === "string") {
            headers.push(makeHeader(m, v));
            continue;
        }

        if (Array.isArray(v)) {
            headers.push(...v.map(i => makeHeader(m, i)));
            continue;
        }

        if ("text" in v) {
            headers.push(makeHeader(m, v.text));
            continue;
        }

        if ("value" in v) {
            headers.push(makeHeader(m, v.value));
            continue;
        }

        if (v instanceof Date) {
            headers.push(makeHeader(m, v.toISOString()));
        }
    }

    return headers;
};

export const mapMessage = (m: Message) => {
    const email = new Email();
    const env = new EmailEnvelope();
    const msg = new EmailMessage();
    const msgBody = new Content();

    env.setMailfrom(m.envelope.mailFrom);
    env.setRcpttoList(m.envelope.rcptTo);

    msgBody.setText(m.mail.text);
    if (typeof m.mail.html === "string") {
        msgBody.setHtml(m.mail.html);
    }

    msg.setSubject(m.mail.subject);
    msg.setBody(msgBody);
    msg.setToList(m.mail.to.value.map(mapEmailAddressToString));
    msg.setFromList(m.mail.from.value.map(mapEmailAddressToString));

    if (m.mail.cc) {
        msg.setCcList(m.mail.cc.value.map(mapEmailAddressToString));
    }

    if (m.mail.bcc) {
        msg.setBccList(m.mail.bcc.value.map(mapEmailAddressToString));
    }

    msg.setHeaderList(mapEmailHeaders(m.mail.headers));

    email.setEnvelope(env);
    email.setMessage(msg);
    email.setDate(m.date.getDate());

    return email;
};