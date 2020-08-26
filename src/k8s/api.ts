import {
    CustomResourceClient, IKubernetesRESTClient, INamespacedResourceClient,
    NamespacedResourceClient
} from "@mittwald/kubernetes";
import {EmailPolicy} from "./types/v1alpha1/emailpolicy";
import {SMTPServer} from "./types/v1alpha1/smtpserver";
import {Registry} from "prom-client";

export const apiGroup = "kube-mail.helmich.me";
export const apiVersion = "v1alpha1";
export const apiGroupVersion = `${apiGroup}/${apiVersion}`;

export type APIGroupVersion = typeof apiGroupVersion;

export interface KubemailV1Alpha1API {
    emailPolicies(): INamespacedResourceClient<EmailPolicy, "EmailPolicy", APIGroupVersion>
    smtpServers(): INamespacedResourceClient<SMTPServer, "SMTPServer", APIGroupVersion>
}

export interface KubemailAPI {
    v1alpha1(): KubemailV1Alpha1API
}

export interface KubemailCustomResourceAPIInterface {
    kubemail(): KubemailAPI;
}

export class KubemailCustomResourceAPI implements KubemailCustomResourceAPIInterface {
    public constructor(private restClient: IKubernetesRESTClient, private registry: Registry) {
    }

    public kubemail(): KubemailAPI {
        return {
            v1alpha1: () => ({
                emailPolicies: () => new CustomResourceClient(
                    new NamespacedResourceClient(this.restClient, `/apis/${apiGroupVersion}`, "/emailpolicies", this.registry),
                    "EmailPolicy",
                    apiGroupVersion,
                ),
                smtpServers: () => new CustomResourceClient(
                    new NamespacedResourceClient(this.restClient, `/apis/${apiGroupVersion}`, "/smtpservers", this.registry),
                    "SMTPServer",
                    apiGroupVersion,
                )
            }),
        };
    }
}
