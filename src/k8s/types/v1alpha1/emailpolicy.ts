import {MetadataObject} from "@mittwald/kubernetes/types/meta";
import {EmailPolicySpec} from "./emailpolicy_spec";

export type EmailPolicy = MetadataObject & {
    spec: EmailPolicySpec;
}
