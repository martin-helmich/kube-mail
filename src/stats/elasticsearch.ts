import {defaultSummarizeOptions, Query, StatisticsRecorder, SummarizeOptions, SummarizeResults} from "./recorder";
import {Policy} from "../policy/provider";
import {Client} from "elasticsearch";
import {anonymizeEmailAddress} from "./anon";
import uuid = require("uuid");

const debug = require("debug")("kubemail:stats:elasticsearch");

export interface ElasticsearchStatisticsRecorderOptions {
    index: string;
    type: string;
}

const defaultOptions: ElasticsearchStatisticsRecorderOptions = {
    index: "kubemail",
    type: "observation",
};

export class ElasticsearchStatisticsRecorder implements StatisticsRecorder {

    private options: ElasticsearchStatisticsRecorderOptions;

    public constructor(private client: Client, opts: Partial<ElasticsearchStatisticsRecorderOptions> = {}) {
        this.options = {...defaultOptions, ...opts};
    }

    public async setup() {
        const {index, type} = this.options;
        const exists = await this.client.indices.exists({index});

        const mapping = {
            properties: {
                sourceID: {type: "keyword"},
                date: {type: "date"},
                sender: {type: "keyword"},
                recipients: {type: "keyword"}
            }
        };

        if (!exists) {
            debug("index %o does not exist yet", index);
            await this.client.indices.create({
                index,
                body: {
                    mappings: {
                        [type]: mapping,
                    },
                }
            });
            debug("index %o created", index);
        } else {
            debug("index %o already exists", index);
            await this.client.indices.putMapping({
                index,
                type,
                body: mapping,
            });
            debug("index %o mapping update", index);
        }
    }

    public async observe(policy: Policy, sender: string, recipients: string[]): Promise<void> {
        const {index, type} = this.options;
        const date = new Date();
        const id = uuid.v4();

        sender = anonymizeEmailAddress(sender);
        recipients = recipients.map(anonymizeEmailAddress);

        debug("observing mail from %o to %o", sender, recipients);

        await this.client.create({
            index,
            type,
            id,
            body: {
                source: policy.sourceReference,
                date,
                sender,
                recipients,
            }
        })
    }

    private static queryToElasticsearchQuery(query: Query): any {
        const term: any = {
            "source.namespace": query.namespace,
        };

        if (query.podName) {
            term["source.podName"] = query.podName;
        }

        if (query.labelSelector) {
            for (const labelName of Object.keys(query.labelSelector)) {
                term[`source.labels.${labelName}`] = query.labelSelector[labelName];
            }
        }

        return {
            bool: {
                must: [
                    {term},
                    {
                        range: {
                            date: {
                                gte: query.from.getTime(),
                                format: "epoch_millis"
                            }
                        }
                    },
                ]
            }
        };
    }

    public async summarize(query: Query, opts: Partial<SummarizeOptions>): Promise<SummarizeResults> {
        opts = {...defaultSummarizeOptions, ...opts};

        const {index, type} = this.options;
        const {interval, timezone} = opts;
        const elasticQuery = ElasticsearchStatisticsRecorder.queryToElasticsearchQuery(query);
        const body = {
            aggs: {
                summary: {
                    date_histogram: {
                        field: "date",
                        interval,
                        time_zone: timezone,
                        min_doc_count: 1,
                    },
                },
                recipients: {
                    terms: {
                        field: "recipients",
                        min_doc_count: 1,
                    }
                },
                senders: {
                    terms: {
                        field: "sender",
                        min_doc_count: 1,
                    }
                }
            },
            stored_fields: ["*"],
            docvalue_fields: ["date"],
            script_fields: {},

            query: elasticQuery,
        };

        debug("running query %o", body);

        const result = await this.client.search({
            index,
            type,
            body,
        });

        debug("received result %O", result);

        return {
            messagesOverTime: result.aggregations.summary.buckets.map((b: any) => ({time: b.key, count: b.doc_count})),
            senders: result.aggregations.senders.buckets.reduce((map: any, obj: any) => ({...map, [obj.key]: obj.doc_count}), {}),
            recipients: result.aggregations.recipients.buckets.reduce((map: any, obj: any) => ({...map, [obj.key]: obj.doc_count}), {}),
        }
    }

}