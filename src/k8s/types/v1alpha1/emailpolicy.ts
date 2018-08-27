import {MetadataObject} from "@mittwald/kubernetes/types/meta";
import {LabelSelector} from "@mittwald/kubernetes/types/meta/v1";

export type SMTPSink = {
    server: {
        name: string;
        namespace?: string;
    };
    credentials: {
        name: string;
        namespace?: string;
    };
    errors?: {
        logErrors: boolean;
        retentionDays?: number;
    }
}

export type CatchSink = {
    retentionDays?: number;
}

export type EmailPolicySpec = {
    default?: boolean;
    podSelector?: LabelSelector;
    ratelimiting?: {
        maximum: number;
        period?: "hour" | "minute";
    };
    sink: {smtp: SMTPSink} | {catch: CatchSink};
};

export type EmailPolicy = MetadataObject & {
    spec: EmailPolicySpec;
}