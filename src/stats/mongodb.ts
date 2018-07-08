import {Query, StatisticsRecorder, SummarizeOptions, SummarizeResults} from "./recorder";
import {Policy} from "../policy/provider";
import {Collection} from "mongodb";
import {anonymizeEmailAddress} from "./anon";
import {mapLabelsForMongodb} from "../sink/mongodb";

export class MongodbStatisticsRecorder implements StatisticsRecorder {

    public constructor(private collection: Collection) {
    }

    public async setup(): Promise<any> {
        return null;
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
        return {
            recipients: {},
            senders: {},
            messagesOverTime: [],
        };
    }

}