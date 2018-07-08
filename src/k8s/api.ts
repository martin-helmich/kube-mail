import {
    CustomResourceClient, IKubernetesRESTClient, INamespacedResourceClient,
    NamespacedResourceClient
} from "@mittwald/kubernetes";
import {EmailPolicy} from "./types/v1alpha1/emailpolicy";
import {SMTPServer} from "./types/v1alpha1/smtpserver";
import {Registry} from "prom-client";

export const apiGroup = "kube-mail.helmich.me/v1alpha1";
export type APIGroup = "kube-mail.helmich.me/v1alpha1";

export interface KubemailV1Alpha1API {
    emailPolicies(): INamespacedResourceClient<EmailPolicy, "EmailPolicy", APIGroup>
    smtpServers(): INamespacedResourceClient<SMTPServer, "SMTPServer", APIGroup>
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
                    new NamespacedResourceClient(this.restClient, `/apis/${apiGroup}`, "/emailpolicies", this.registry),
                    "EmailPolicy",
                    apiGroup,
                ),
                smtpServers: () => new CustomResourceClient(
                    new NamespacedResourceClient(this.restClient, `/apis/${apiGroup}`, "/smtpservers", this.registry),
                    "SMTPServer",
                    apiGroup,
                )
            }),
        };
    }
}