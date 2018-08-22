import {Query, StatisticsRecorder, SummarizeOptions, SummarizeResults} from "./recorder";
import {Policy} from "../policy/provider";
import {Collection} from "mongodb";
import {anonymizeEmailAddress} from "./anon";
import {mapLabelsForMongodb} from "../sink/mongodb";
import * as _ from "lodash";

export class MongodbStatisticsRecorder implements StatisticsRecorder {

    public constructor(private collection: Collection) {
    }

    public async setup(): Promise<any> {
        await this.collection.createIndex({"source.namespace": 1, date: 1});
    }

    public async observe(policy: Policy, sender: string, recipients: string[]): Promise<void> {
        sender = anonymizeEmailAddress(sender);
        recipients = recipients.map(anonymizeEmailAddress);

        const date = new Date();
        const doc = {
            source: {
                ...policy.sourceReference,
                labels: policy.sourceReference.labels ? mapLabelsForMongodb(policy.sourceReference.labels) : undefined
            },
            date,
            sender,
            recipients
        };

        await this.collection.insertOne(doc);
    }

    public async summarize(query: Query, opts: Partial<SummarizeOptions>): Promise<SummarizeResults> {
        const q = {
            "source.namespace": query.namespace,
            "date": {$gte: query.from},
        };

        const results = await this.collection.aggregate([
            {$match: q},
            {
                $facet: {
                    messagesOverTime: [
                        {
                            $group: {
                                _id: {
                                    year: {$year: "$date"},
                                    month: {$month: "$date"},
                                    day: {$dayOfMonth: "$date"}
                                },
                                count: {$sum: 1}
                            }
                        },
                        {
                            $project: {
                                _id: false,
                                date: {
                                    $dateFromParts: {
                                        year: "$_id.year",
                                        month: "$_id.month",
                                        day: "$_id.day"
                                    }
                                },
                                count: true
                            }
                        }
                    ],
                    recipients: [
                        {$unwind: "$recipients"},
                        {$group: {_id: "$recipients", count: {$sum: 1}}}
                    ],
                    senders: [
                        {$group: {_id: "$sender", count: {$sum: 1}}}
                    ]
                }
            }
        ]).next();

        return {
            recipients: _.fromPairs(results.recipients.map((r: any) => [r._id, r.count])),
            senders: _.fromPairs(results.senders.map((r: any) => [r._id, r.count])),
            messagesOverTime: results.messagesOverTime.map((m: any) => {
                return {
                    time: Math.floor(m.date.getTime() / 1000),
                    count: m.count,
                }
            }),
        };
    }

}