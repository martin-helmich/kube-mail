import {SMTPServer} from "smtp-server";
import {SMTPBackend} from "./backend";
import {StaticPolicyProvider} from "./policy/static";
import {ParserImpl} from "./sink/parser";
import {ElasticsearchSink} from "./sink/elasticsearch";
import {Client} from "elasticsearch";
import {Sink} from "./sink/interface";
import {SMTPUpstream} from "./upstream/smtp";
import * as express from "express";
import {APIServer} from "./api";
import {StatisticsRecorder} from "./stats/recorder";
import {ElasticsearchStatisticsRecorder} from "./stats/elasticsearch";

console.log("starting");

const client = new Client({host: "localhost:9200"});
const debug = require("debug")("kubemail:main");
const parser = new ParserImpl();
const sink: Sink = new ElasticsearchSink(client, {index: "caught-messages"});
const recorder: StatisticsRecorder = new ElasticsearchStatisticsRecorder(client, {index: "records"});
// const provider = new StaticPolicyProvider({
//     id: "fallback",
//     sourceReference: {identifier: "martin"},
//     type: "catch"
// });
const provider = new StaticPolicyProvider({
    id: "fallback",
    sourceReference: {identifier: "martin"},
    type: "forward",
    smtp: {
        server: "smtp.1und1.de",
        port: 465,
        tls: true,
        auth: {
            method: "PLAIN",
            username: "m37160104-5",
            password: "juddl12-4",
        }
    }
});
const upstream = new SMTPUpstream();
const backend = new SMTPBackend(provider, parser, recorder, sink, upstream);

(async () => {
    if (sink.setup) {
        debug("setting up sink");
        await sink.setup();
    }

    if (recorder.setup) {
        debug("setting up recorder");
        await recorder.setup();
    }

    const api = new APIServer({
        sink,
        recorder,
    });

    const server = new SMTPServer({
        authOptional: true,
        banner: "KubeMail 1.0",
        logger: true,
        onAuth: backend.handleAuthentication.bind(backend),
        onConnect: backend.onConnect.bind(backend),
        onData: backend.onData.bind(backend),
    });

    api.listen(8080);
    server.listen(1025);
})();
