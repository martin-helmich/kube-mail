/* Do not change, this code is generated from Golang structs */

import {LabelSelector} from "@mittwald/kubernetes/types/meta/v1"
import {policyPeriod} from "./enums"

export interface ObjectReference {
    name: string;
    namespace?: string;
}
export interface EmailPolicySMTPSink {
    server: ObjectReference;
    credentials?: ObjectReference;
}
export interface EmailPolicyRateLimiting {
    maximum: number;
    period?: policyPeriod;
}
export interface EmailPolicySink {
    smtp: EmailPolicySMTPSink;
}
export interface EmailPolicySpec {
    default?: boolean;
    podSelector?: LabelSelector;
    ratelimiting?: EmailPolicyRateLimiting;
    sink: EmailPolicySink;
}