import {ForwardPolicy, Policy, PolicyProvider, SourceReference} from "./provider";
import {PolicyStore} from "../k8s/policy_store";
import {PodStore} from "../k8s/pod_store";
import {SMTPServer} from "../k8s/types/v1alpha1/smtpserver";
import {Secret} from "@mittwald/kubernetes/types/core/v1";
import {Store} from "../k8s/store";

const debug = require("debug")("policy:k8s");

export class KubernetesPolicyProvider implements PolicyProvider {

    public constructor(private podStore: PodStore,
                       private policyStore: PolicyStore,
                       private smtpServerStore: Store<SMTPServer>,
                       private secretStore: Store<Secret>,
                       private staticPolicy: string | undefined) {
    }

    public async getByClientIP(clientIP: string): Promise<Policy | undefined> {
        debug("resolving policy for pod IP %s", clientIP);

        let pod = this.podStore.getByPodIP(clientIP);
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

        if ("catch" in spec.sink) {
            return {
                type: "catch",
                id: policy.metadata.namespace + "/" + policy.metadata.name,
                sourceReference,
                retention: spec.sink.catch.retentionDays,
            };
        }

        if ("smtp" in spec.sink) {
            const {smtp} = spec.sink;

            const smtpServerNamespace = smtp.server.namespace || policy.metadata.namespace || "";
            const smtpSecretNamespace = smtp.credentials.namespace || policy.metadata.namespace || "";

            const [smtpServer, smtpSecret] = await Promise.all([
                this.smtpServerStore.get(smtpServerNamespace, smtp.server.name),
                this.secretStore.get(smtpSecretNamespace, smtp.credentials.name)
            ]);

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
                errors: smtp.errors || {
                    logErrors: true,
                    retention: 3,
                },
                smtp: {
                    server: smtpServer.spec.server,
                    port: smtpServer.spec.port || 587,
                    auth: {
                        method: smtpServer.spec.authType || "PLAIN",
                        username: new Buffer(secretData["username"], "base64").toString("utf-8"),
                        password: new Buffer(secretData["password"], "base64").toString("utf-8"),
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