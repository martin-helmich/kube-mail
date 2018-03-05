export type SourceReference = {
    identifier: string;
}

export type CatchPolicy = {
    id: string;
    type: "catch";
    sourceReference: SourceReference;
    ownershipLabels?: {[k: string]: string}
}

export type ForwardPolicy = {
    id: string;
    type: "forward";
    sourceReference: SourceReference;
    ratelimit?: {
        maximum: number;
        limitPeriod: "hour"|"minute";
    };
    smtp: {
        server: string;
        port: number;
        tls?: boolean;
        auth?: {
            method: "PLAIN"|"LOGIN";
            username: string;
            password: string;
        }
    };
}

export type Policy = CatchPolicy | ForwardPolicy;

export interface PolicyProvider {
    getByClientIP(clientIP: string): Promise<Policy|undefined>;
}