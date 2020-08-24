import {EmailAddress, Headers, HeaderValue} from "mailparser";
import {Email} from "./proto/service_pb";
import {StoredMessage} from "../sink/interface";
import Header = Email.EmailMessage.Header;
import EmailEnvelope = Email.EmailEnvelope;
import EmailMessage = Email.EmailMessage;
import Content = Email.EmailMessage.Content;
import Source = Email.Source;
import * as _ from "lodash";

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
            headers.push(...mapFuckValue(v, (value: any) => makeHeader(m, value)));
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

export const mapMessage = (m: StoredMessage) => {
    const email = new Email();
    const source = new Source();
    const env = new EmailEnvelope();
    const msg = new EmailMessage();
    const msgBody = new Content();

    source.setNamespace(m.source.namespace);
    source.setPodName(m.source.podName);

    if (m.source.labels) {
        for (const k of Object.keys(m.source.labels)) {
            source.getLabelMap().set(k, m.source.labels[k]);
        }
    }

    env.setMailFrom(m.envelope.mailFrom);
    env.setRcptToList(m.envelope.rcptTo);

    if (m.mail.text) {
        msgBody.setText(m.mail.text);
    }

    if (typeof m.mail.html === "string") {
        msgBody.setHtml(m.mail.html);
    }

    if (m.mail.subject) {
        msg.setSubject(m.mail.subject);
    }

    msg.setBody(msgBody);
    msg.setToList(mapFuckValue(m.mail.to, mapEmailAddressToString));
    msg.setFromList(mapFuckValue(m.mail.from, mapEmailAddressToString));

    if (m.mail.cc) {
        msg.setCcList(mapFuckValue(m.mail.cc, mapEmailAddressToString));
    }

    if (m.mail.bcc) {
        msg.setBccList(mapFuckValue(m.mail.bcc, mapEmailAddressToString));
    }

    msg.setHeaderList(mapEmailHeaders(m.mail.headers));

    email.setId(m.id);
    email.setSource(source);
    email.setEnvelope(env);
    email.setMessage(msg);
    email.setDate(Math.floor(m.date.getTime() / 1000));

    return email;
};

const mapFuckValue = (v: any, mapperFunction: any): any[] => {
    if (Array.isArray(v)) {
        return _.flatten(v.map(e => e.value.map((v:any) => mapperFunction(v))));
    }

    return v.value.map(mapperFunction);
};
