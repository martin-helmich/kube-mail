import {EmailAddress, Headers, HeaderValue} from "mailparser";
import {Email} from "./proto/service_pb";
import Header = Email.EmailMessage.Header;

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