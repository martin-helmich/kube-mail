import {ForwardPolicy, Policy, PolicyProvider, SourceReference} from "./provider";
import {PolicyStore} from "../k8s/policy_store";
import {PodStore} from "../k8s/pod_store";
import {SMTPServer} from "../k8s/types/v1alpha1/smtpserver";
import {Secret} from "@mittwald/kubernetes/types/core/v1";
import {Store} from "../k8s/store";
import {ObjectMeta} from "@mittwald/kubernetes/types/meta/v1";
import {MetadataObject} from "@mittwald/kubernetes/types/meta";

const debug = require("debug")("policy:k8s");

export class KubernetesPolicyProvider implements PolicyProvider {

    public constructor(private podStore: PodStore,
                       private policyStore: PolicyStore,
                       private smtpServerStore: Store<SMTPServer>,
                       private secretStore: Store<Secret>,
                       private staticPolicy: string | null) {
    }

    public async getByClientIP(clientIP: string): Promise<Policy | undefined> {
        debug("resolving policy for pod IP %s", clientIP);

        let pod = await this.podStore.getByPodIP(clientIP);
        if (!pod) {
            if (this.staticPolicy) {
                pod = {
                    metadata: {
                        name: "localhost",
                        namespace: "default"
                    },
                    spec: {
                        containers: []
                    },
                    status: {
                        conditions: [],
                        hostIP: "127.0.0.1",
                        message: "Test",
                        podIP: "127.0.0.1",
                        phase: "Running",
                        qosClass: "Guaranteed",
                        reason: "no reason",
                        startTime: new Date().toISOString(),
                    }
                }
            } else {
                debug("pod not found");
                return undefined;
            }
        }

        const {namespace = "", labels = {}} = pod.metadata;
        const policies = this.policyStore.match(namespace, labels);

        if (this.staticPolicy) {
            const [ns, n] = this.staticPolicy.split("/");
            const p = await this.policyStore.get(ns, n);

            if (p) {
                policies.push(p)
            }
        }

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

        if ("smtp" in spec.sink) {
            const {smtp} = spec.sink;

            const smtpServerNamespace = smtp.server.namespace || policy.metadata.namespace || "";
            const smtpServer = await this.smtpServerStore.get(smtpServerNamespace, smtp.server.name);

            if (!smtpServer) {
                return undefined;
            }

            const forwardPolicy: ForwardPolicy = {
                id: objectMetaToString(policy),
                sourceReference,
                smtp: {
                    name: objectMetaToString(smtpServer),
                    server: smtpServer.spec.server,
                    port: smtpServer.spec.port || 587,
                    tls: smtpServer.spec.tls === undefined ? true : smtpServer.spec.tls,
                },
            };

            if (smtp.credentials) {
                const smtpSecretNamespace = smtp.credentials.namespace || policy.metadata.namespace || "";
                const smtpSecret = await this.secretStore.get(smtpSecretNamespace, smtp.credentials.name);

                if (!smtpSecret) {
                    return undefined;
                }

                const {data: secretData = {}} = smtpSecret;

                forwardPolicy.smtp.auth = {
                    method: smtpServer.spec.authType || "PLAIN",
                    username: new Buffer(secretData["username"], "base64").toString("utf-8"),
                    password: new Buffer(secretData["password"], "base64").toString("utf-8"),
                };
            }

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

function objectMetaToString(o: MetadataObject): string {
    return `${o.metadata.namespace}/${o.metadata.name}`;
}
