import {KubernetesPolicyProvider} from "./kubernetes";
import {PolicyStore} from "../k8s/policy_store";
import {PodStore} from "../k8s/pod_store";
import {IKubernetesAPI} from "@mittwald/kubernetes";
import {KubemailCustomResourceAPI} from "../k8s/api";
import {CachingLookupStore} from "../k8s/store";
import {Controller, Informer} from "@mittwald/kubernetes/cache";
import {IInformerConfig} from '../config';
import {Pod, PodWithStatus} from "@mittwald/kubernetes/types/core/v1";
import {EmailPolicy} from "../k8s/types/v1alpha1/emailpolicy";

export class KubernetesPolicyProviderFactory {
    private readonly api: IKubernetesAPI & KubemailCustomResourceAPI
    private readonly emailPolicyInformerConfig: IInformerConfig;
    private readonly podInformerConfig: IInformerConfig;
    private readonly staticPolicy: string | null;

    public constructor(
        api: IKubernetesAPI & KubemailCustomResourceAPI,
        emailPolicyInformerConfig: IInformerConfig,
        podInformerConfig: IInformerConfig,
        staticPolicy: string | null,
    ) {
        this.api = api;
        this.emailPolicyInformerConfig = emailPolicyInformerConfig;
        this.podInformerConfig = podInformerConfig;
        this.staticPolicy = staticPolicy;
    }

    public build(): [KubernetesPolicyProvider, Promise<void>, () => Promise<void>] {
        const kubemailAPIv1a1 = this.api.kubemail().v1alpha1();
        const coreAPIv1 = this.api.core().v1();

        const smtpServerInformer = new Informer(kubemailAPIv1a1.smtpServers());
        const [emailPolicyInformer, emailPolicyStore] = this.buildEmailPolicyInformer();
        const [podInformer, podStore] = this.buildPodInformer();

        const secretStore = new CachingLookupStore(coreAPIv1.secrets());

        const podController = podInformer.start();
        const emailPolicyController = emailPolicyInformer.start();
        const smtpServerController = smtpServerInformer.start();

        const initialized = this.initializeController(smtpServerController, emailPolicyController, podController);

        Promise.all([
            podController.waitUntilFinish(),
            emailPolicyController.waitUntilFinish(),
            smtpServerController.waitUntilFinish(),
        ]).catch(err => {
            console.error("error while listening for Kubernetes objects", err);
            process.exit(1);
        });

        const policyProvider = new KubernetesPolicyProvider(podStore, emailPolicyStore, smtpServerInformer.store, secretStore, this.staticPolicy);
        const stop = async () => {
            await Promise.all([
                smtpServerController.stop(),
                emailPolicyController.stop(),
                podController.stop(),
            ]);
        };

        return [policyProvider, initialized, stop];
    }

    private buildEmailPolicyInformer(): [Informer<EmailPolicy>, PolicyStore] {
        const kubemailAPIv1a1 = this.api.kubemail().v1alpha1();
        const emailPolicyInformerLabelSelectorConfig = this.emailPolicyInformerConfig;

        let emailPolicyInformerLabelSelector = {};
        if (emailPolicyInformerLabelSelectorConfig && emailPolicyInformerLabelSelectorConfig.selector) {
            emailPolicyInformerLabelSelector = emailPolicyInformerLabelSelectorConfig.selector;
        }

        const emailPolicyStore = new PolicyStore();

        return [new Informer(kubemailAPIv1a1.emailPolicies(), emailPolicyInformerLabelSelector, emailPolicyStore), emailPolicyStore];
    }

    private buildPodInformer(): [Informer<Pod, PodWithStatus>, PodStore] {
        const coreAPIv1 = this.api.core().v1();
        const podInformerLabelSelectorConfig = this.podInformerConfig;

        let podInformerLabelSelector = {};
        if (podInformerLabelSelectorConfig && podInformerLabelSelectorConfig.selector) {
            podInformerLabelSelector = podInformerLabelSelectorConfig.selector;
        }

        const podStore = new PodStore(new CachingLookupStore(coreAPIv1.pods()), coreAPIv1.pods());
        return [new Informer(coreAPIv1.pods(), podInformerLabelSelector, podStore), podStore];
    }

    private initializeController(serverController: Controller, policyController: Controller, podController: Controller): Promise<void> {
        return Promise.all([
            serverController.waitForInitialList(),
            policyController.waitForInitialList(),
            podController.waitForInitialList(),
        ]).then(() => {
        });
    }
}
