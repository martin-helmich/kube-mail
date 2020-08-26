import {SMTPServer} from "smtp-server";
import {SMTPBackend} from "./backend";
import {SMTPUpstream} from "./upstream/smtp";
import {Registry} from "prom-client";
import {IInformerConfig, PolicyConfig} from "./config";
import {buildKubernetesClientFromConfig} from "./k8s/factory";
import {KubernetesPolicyProviderFactory} from "./policy/factory";
import {MonitoringServer} from "./monitoring";
import {PrometheusRecorder} from "./stats/recorder";
import {debug as d} from "./debug";

export async function main(
    policyConfig: PolicyConfig,
    emailPolicyInformerConfig: IInformerConfig,
    podInformerConfig: IInformerConfig,
    register: Registry,
): Promise<() => Promise<void>> {
    d("starting");

    const api = buildKubernetesClientFromConfig(policyConfig, register);

    const providerFactory = new KubernetesPolicyProviderFactory(api, emailPolicyInformerConfig, podInformerConfig, policyConfig.kubernetes.static || null);
    const [provider, providerInitialized, stopProvider] = providerFactory.build();

    const recorder = new PrometheusRecorder(register);
    const upstream = new SMTPUpstream();
    const backend = new SMTPBackend(provider, recorder, upstream);

    const smtpServer = new SMTPServer({
        authOptional: true,
        banner: "KubeMail 1.0",
        logger: true,
        onAuth: backend.handleAuthentication.bind(backend),
        onConnect: backend.onConnect.bind(backend),
        onData: backend.onData.bind(backend),
    });

    const monitoringServer = new MonitoringServer();

    await providerInitialized;

    monitoringServer.listen(9100);
    smtpServer.listen(1025);

    return async () => {
        d("stopping servers");
        await stopProvider();
        await monitoringServer.close();
        await new Promise(res => smtpServer.close(res));

        d("servers stopped");
    }
}
