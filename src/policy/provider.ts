import {Pod, PodWithStatus} from "@mittwald/kubernetes/types/core/v1";

export type SourceReference = {
    namespace: string;
    podName: string;
    labels?: { [k: string]: string };
}

export type ForwardPolicy = {
    id: string;
    namespace: string;
    name: string;
    sourceReference: SourceReference;
    ratelimit?: {
        maximum: number;
        limitPeriod: "hour" | "minute";
    };
    smtp: {
        id: string;
        name: string;
        namespace: string;
        server: string;
        port: number;
        tls?: boolean;
        auth?: {
            method: "PLAIN" | "LOGIN" | "CRAM-MD5" | "SCRAM-SHA-1";
            username: string;
            password: string;
        }
        debug?: boolean;
        logger?: boolean;
    };
}

export type Policy = ForwardPolicy;

export interface PolicyProvider {
    getByClientIP(clientIP: string): Promise<[Policy | undefined, PodWithStatus | undefined]>;
}
