import {KubernetesPolicyProvider} from "./kubernetes";
import {PolicyStore} from "../k8s/policy_store";
import {PodStore} from "../k8s/pod_store";
import {IKubernetesAPI} from "@mittwald/kubernetes";
import {KubemailCustomResourceAPI} from "../k8s/api";
import {CachingLookupStore} from "../k8s/store";
import * as config from "config";
import {Informer} from "@mittwald/kubernetes/cache";

export class KubernetesPolicyProviderFactory {
    public constructor(private api: IKubernetesAPI & KubemailCustomResourceAPI) {

    }

    public build(): [KubernetesPolicyProvider, Promise<void>] {
        const kubemailAPIv1a1 = this.api.kubemail().v1alpha1();
        const coreAPIv1 = this.api.core().v1();

        const smtpServerInformer = new Informer(kubemailAPIv1a1.smtpServers());
        const emailPolicyStore = new PolicyStore();
        const emailPolicyInformer = new Informer(kubemailAPIv1a1.emailPolicies(), {}, emailPolicyStore);
        const podStore = new PodStore();
        const podInformer = new Informer(coreAPIv1.pods(), {}, podStore);
        const secretStore = new CachingLookupStore(coreAPIv1.secrets());

        const serverController = smtpServerInformer.start();
        const policyController = emailPolicyInformer.start();
        const podController = podInformer.start();

        const initialized = Promise.all([
            serverController.waitForInitialList(),
            policyController.waitForInitialList(),
            podController.waitForInitialList(),
        ]).then(() => {});

        return [
            new KubernetesPolicyProvider(podStore, emailPolicyStore, smtpServerInformer.store, secretStore, config.get("policy.kubernetes.static")),
            initialized,
        ];
    }
}