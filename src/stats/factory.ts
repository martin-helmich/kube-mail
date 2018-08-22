import {RecorderConfig} from "../config";
import {Client} from "elasticsearch";
import {StatisticsRecorder} from "./recorder";
import {ElasticsearchStatisticsRecorder} from "./elasticsearch";
import {Db} from "mongodb";
import {MongodbStatisticsRecorder} from "./mongodb";

export const buildRecorderFromConfig = (cfg: RecorderConfig, elasticsearchClient?: Client, mongoDB?: Db): StatisticsRecorder => {
    switch (cfg.type) {
        case "elasticsearch":
            if (!elasticsearchClient) {
                throw new Error("elasticsearch connection must be provided");
            }

            return new ElasticsearchStatisticsRecorder(elasticsearchClient, {index: cfg.elasticsearch.index});
        case "mongodb":
            if (!mongoDB) {
                throw new Error("MongoDB connection must be provided");
            }

            const collection = mongoDB.collection(cfg.mongodb.collection || "caughtMails");

            return new MongodbStatisticsRecorder(collection);


        default:
            throw new Error(`unknown recorder type: '${(cfg as any).type}'`);
    }
};