import {ForwardPolicy, Policy, PolicyProvider, SourceReference} from "./provider";
import {PolicyStore} from "../k8s/policy_store";
import {PodStore} from "../k8s/pod_store";
import {SMTPServer} from "../k8s/types/v1alpha1/smtpserver";
import {Store} from "../k8s/informer";
import {Secret} from "@mittwald/kubernetes/types/core/v1";

const debug = require("debug")("policy:k8s");

export class KubernetesPolicyProvider implements PolicyProvider {

    public constructor(private podStore: PodStore,
                       private policyStore: PolicyStore,
                       private smtpServerStore: Store<SMTPServer>,
                       private secretStore: Store<Secret>) {
    }

    public async getByClientIP(clientIP: string): Promise<Policy | undefined> {
        debug("resolving policy for pod IP %s", clientIP);

        const pod = this.podStore.getByPodIP(clientIP);
        if (!pod) {
            debug("pod not found");
            return undefined;
        }

        const {namespace = "", labels = {}} = pod.metadata;
        const policies = this.policyStore.match(namespace, labels);

        if (policies.length === 0) {
            debug("no policies defined");
            return undefined;
        }

        const policy = policies[0];
        const {spec} = policy;
        const sourceReference: SourceReference = {
            namespace: pod.metadata.namespace || "",
            podName: pod.metadata.name,
            labels: pod.metadata.labels,
        };

        debug("policy found: %o", policy.metadata.name);

        if ("catch" in spec.sink) {
            return {
                type: "catch",
                id: policy.metadata.namespace + "/" + policy.metadata.name,
                sourceReference,
            };
        }

        if ("smtp" in spec.sink) {
            const {smtp} = spec.sink;

            const smtpServerNamespace = smtp.server.namespace || policy.metadata.namespace || "";
            const smtpServer = this.smtpServerStore.get(smtpServerNamespace, smtp.server.name);
            const smtpSecretNamespace = smtp.credentials.namespace || policy.metadata.namespace || "";
            const smtpSecret = this.secretStore.get(smtpSecretNamespace, smtp.credentials.name);

            if (!smtpServer) {
                return undefined;
            }

            if (!smtpSecret) {
                return undefined;
            }

            const {data: secretData = {}} = smtpSecret;

            const forwardPolicy: ForwardPolicy = {
                type: "forward",
                id: policy.metadata.namespace + "/" + policy.metadata.name,
                sourceReference,
                smtp: {
                    server: smtpServer.spec.server,
                    port: smtpServer.spec.port || 587,
                    auth: {
                        method: smtpServer.spec.authType || "PLAIN",
                        username: secretData["username"],
                        password: secretData["password"],
                    },
                    tls: smtpServer.spec.tls === undefined ? true : smtpServer.spec.tls,
                },
            };

            if (spec.ratelimiting) {
                forwardPolicy.ratelimit = {
                    limitPeriod: spec.ratelimiting.period || "minute",
                    maximum: spec.ratelimiting.maximum,
                }
            }

            return forwardPolicy;
        }

        return undefined;
    }

}