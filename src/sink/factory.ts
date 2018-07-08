import {SinkConfig} from "../config";
import {ElasticsearchSink} from "./elasticsearch";
import {Client} from "elasticsearch";
import {Sink} from "./interface";
import {MongodbSink} from "./mongodb";
import {Db} from "mongodb";

export const buildSinkFromConfig = (cfg: SinkConfig, elasticsearchClient?: Client, mongoDbConnection?: Db): Sink => {
    switch (cfg.type) {
        case "elasticsearch":
            if (!elasticsearchClient) {
                throw new Error("elasticsearch connection must be provided");
            }

            return new ElasticsearchSink(elasticsearchClient, {index: cfg.elasticsearch.index});
        case "mongodb":
            if (!mongoDbConnection) {
                throw new Error("MongoDB connection must be provided");
            }

            const collection = mongoDbConnection.collection(cfg.mongodb.collection || "caughtMails");

            return new MongodbSink(collection);

        default:
            throw new Error(`unsupported sink type: '${(cfg as any).type}'`);
    }
};