import {SMTPServer} from "smtp-server";
import {SMTPBackend} from "./backend";
import {ParserImpl} from "./sink/parser";
import {Client} from "elasticsearch";
import {SMTPUpstream} from "./upstream/smtp";
import {APIServer} from "./api";
import {register} from "prom-client";
import * as config from "config";
import {buildSinkFromConfig} from "./sink/factory";
import {PolicyConfig, RecorderConfig, SinkConfig} from "./config";
import {buildRecorderFromConfig} from "./stats/factory";
import {buildKubernetesClientFromConfig} from "./k8s/factory";
import {KubernetesPolicyProviderFactory} from "./policy/factory";
import {MonitoringServer} from "./monitoring";

console.log("starting");

const client = new Client({host: config.get("elasticsearch.host")});

const debug = require("debug")("kubemail:main");
const parser = new ParserImpl();
const sink = buildSinkFromConfig(config.get<SinkConfig>("sink"), client);
const recorder = buildRecorderFromConfig(config.get<RecorderConfig>("recorder"), client);

(async () => {
    if (sink.setup) {
        debug("setting up sink");
        await sink.setup();
    }

    if (recorder.setup) {
        debug("setting up recorder");
        await recorder.setup();
    }

    const api = buildKubernetesClientFromConfig(config.get<PolicyConfig>("policy"), register);

    const providerFactory = new KubernetesPolicyProviderFactory(api);
    const [provider, providerInitialized] = providerFactory.build();

    const upstream = new SMTPUpstream();
    const backend = new SMTPBackend(provider, parser, recorder, sink, upstream);

    const apiServer = new APIServer({
        sink,
        recorder,
    });

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
    apiServer.listen(8080);
    smtpServer.listen(1025);
})();
