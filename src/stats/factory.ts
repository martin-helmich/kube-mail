import {RecorderConfig} from "../config";
import {Client} from "elasticsearch";
import {StatisticsRecorder} from "./recorder";
import {ElasticsearchStatisticsRecorder} from "./elasticsearch";

export const buildRecorderFromConfig = (cfg: RecorderConfig, client: Client): StatisticsRecorder => {
    switch (cfg.type) {
        case "elasticsearch":
            return new ElasticsearchStatisticsRecorder(client, {
                index: cfg.elasticsearch.index,
            });

        default:
            throw new Error(`unknown recorder type: '${cfg.type}'`);
    }
};