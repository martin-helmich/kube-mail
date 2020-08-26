import {SMTPServer} from "smtp-server";
import {SMTPBackend} from "./backend";
import {SMTPUpstream} from "./upstream/smtp";
import {register} from "prom-client";
import * as config from "config";
import {PolicyConfig} from "./config";
import {buildKubernetesClientFromConfig} from "./k8s/factory";
import {KubernetesPolicyProviderFactory} from "./policy/factory";
import {MonitoringServer} from "./monitoring";
import {PrometheusRecorder} from "./stats/recorder";

console.log("starting");

(async () => {
    const api = buildKubernetesClientFromConfig(config.get<PolicyConfig>("policy"), register);

    const providerFactory = new KubernetesPolicyProviderFactory(api);
    const [provider, providerInitialized] = providerFactory.build();

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
})().catch(err => {
    console.error(err);
    process.exit(1);
});
