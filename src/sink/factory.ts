import {SinkConfig} from "../config";
import {ElasticsearchSink} from "./elasticsearch";
import {Client} from "elasticsearch";
import {Sink} from "./interface";

export const buildSinkFromConfig = (cfg: SinkConfig, elasticsearchClient: Client): Sink => {
    switch (cfg.type) {
        case "elasticsearch":
            return new ElasticsearchSink(elasticsearchClient, {
                index: cfg.elasticsearch.index,
            });

        default:
            throw new Error(`unsupported sink type: '${cfg.type}'`);
    }
};