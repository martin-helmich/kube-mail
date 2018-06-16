import {KubernetesPolicyProvider} from "./kubernetes";
import {PolicyStore} from "../k8s/policy_store";
import {Informer} from "../k8s/informer";
import {PodStore} from "../k8s/pod_store";
import {IKubernetesAPI} from "@mittwald/kubernetes";
import {KubemailCustomResourceAPI} from "../k8s/api";

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
        const secretInformer = new Informer(coreAPIv1.secrets());

        const serverController = smtpServerInformer.start();
        const policyController = emailPolicyInformer.start();
        const podController = podInformer.start();
        const secretController = secretInformer.start();

        const initialized = Promise.all([
            serverController.waitForInitialList(),
            policyController.waitForInitialList(),
            podController.waitForInitialList(),
            secretController.waitForInitialList(),
        ]).then(() => {});

        return [
            new KubernetesPolicyProvider(podStore, emailPolicyStore, smtpServerInformer.store, secretInformer.store),
            initialized,
        ];
    }
}