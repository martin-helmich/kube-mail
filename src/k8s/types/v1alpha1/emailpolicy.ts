import {MetadataObject} from "@mittwald/kubernetes/types/meta";
import {LabelSelector} from "@mittwald/kubernetes/types/meta/v1";

export type SMTPSink = {
    server: {
        name: string;
        namespace?: string;
    };
    credentials?: {
        name: string;
        namespace?: string;
    };
}

export type EmailPolicySpec = {
    default?: boolean;
    podSelector?: LabelSelector;
    ratelimiting?: {
        maximum: number;
        period?: "hour" | "minute";
    };
    sink: {smtp: SMTPSink};
};

export type EmailPolicy = MetadataObject & {
    spec: EmailPolicySpec;
}
