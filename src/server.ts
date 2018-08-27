import {SMTPServer} from "smtp-server";
import {SMTPBackend} from "./backend";
import {ParserImpl} from "./sink/parser";
import {SMTPUpstream} from "./upstream/smtp";
import {APIServer} from "./api";
import {register} from "prom-client";
import * as config from "config";
import {buildSinkFromConfig} from "./sink/factory";
import {PolicyConfig, SinkConfig} from "./config";
import {buildKubernetesClientFromConfig} from "./k8s/factory";
import {KubernetesPolicyProviderFactory} from "./policy/factory";
import {MonitoringServer} from "./monitoring";
import {GRPCServer} from "./grpc/server";
import {MongoClient} from "mongodb";

console.log("starting");

(async () => {
    const mongo = (await MongoClient.connect(config.get("mongodb.url"), {useNewUrlParser: true}));
    const db = mongo.db();

    const debug = require("debug")("kubemail:main");
    const parser = new ParserImpl();
    const sink = buildSinkFromConfig(config.get<SinkConfig>("sink"), db);

    if (sink.setup) {
        debug("setting up sink");
        await sink.setup();
    }

    const api = buildKubernetesClientFromConfig(config.get<PolicyConfig>("policy"), register);

    const providerFactory = new KubernetesPolicyProviderFactory(api);
    const [provider, providerInitialized] = providerFactory.build();

    const upstream = new SMTPUpstream();
    const backend = new SMTPBackend(provider, parser, sink, upstream);

    const apiServer = new APIServer({sink});
    const grpcServer = new GRPCServer({sink});

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

    if (config.get<boolean>("rest.enabled")) {
        apiServer.listen(config.get<number>("rest.port"));
    }

    if (config.get<boolean>("grpc.enabled")) {
        grpcServer.listen(config.get<number>("grpc.port"));
    }

    smtpServer.listen(1025);
})().catch(err => {
    console.error(err);
    process.exit(1);
});
