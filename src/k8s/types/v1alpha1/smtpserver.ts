import {MetadataObject} from "@mittwald/kubernetes/types/meta";

export type SMTPServerSpec = {
    server: "string";
    port?: number;
    tls?: boolean;
    authType?: "PLAIN" | "LOGIN" | "CRAM-MD5" | "SCRAM-SHA-1";
}

export type SMTPServer = MetadataObject & {
    spec: SMTPServerSpec;
}