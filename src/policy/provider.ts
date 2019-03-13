export type SourceReference = {
    namespace: string;
    podName: string;
    labels?: { [k: string]: string };
}

export type CatchPolicy = {
    id: string;
    type: "catch";
    sourceReference: SourceReference;
    retention?: number
}

export type ForwardPolicy = {
    id: string;
    type: "forward";
    sourceReference: SourceReference;
    ratelimit?: {
        maximum: number;
        limitPeriod: "hour" | "minute";
    };
    smtp: {
        server: string;
        port: number;
        tls?: boolean;
        auth?: {
            method: "PLAIN" | "LOGIN" | "CRAM-MD5" | "SCRAM-SHA-1";
            username: string;
            password: string;
        }
        debug: boolean;
    };
}

export type Policy = CatchPolicy | ForwardPolicy;

export interface PolicyProvider {
    getByClientIP(clientIP: string): Promise<Policy | undefined>;
}
