import {
    Message,
    Query,
    RealtimeSink,
    StoredError,
    StoredMessage
} from "./interface";
import {CatchPolicy, ForwardPolicy, SourceReference} from "../policy/provider";
import {TypedStream} from "../util";
import {Collection, ObjectID} from "mongodb";
import {Stream} from "stream";
import uuid = require("uuid");
import {ErrorListResult, RetrieveResult, SummarizeResults} from "./results";
import {RetrieveOptions, RetrieveStreamOptions} from "./options";
import * as _ from "lodash";
import {anonymizeEmailAddress} from "./anon";

const debug = require("debug")("kubemail:sink:mongodb");

export const mapLabelsForMongodb = (input: {[k: string]: string}): {[k:string]: string} => {
    const output: {[k:string]: string} = {};
    for (const k of Object.keys(input)) {
        const mapped = k.replace(".", "~");
        output[mapped] = input[k];
    }
    return output;
};

const addMissingIDs = (m: StoredMessage) => {
    if (m.id === undefined) {
        m.id = ((m as any)._id as ObjectID).toHexString();
    }

    return m;
};

export class MongodbSink implements RealtimeSink {

    public constructor(
        private caughtMessages: Collection,
        private observedMessages: Collection,
        private errors: Collection,
    ) {
    }

    public async setup(): Promise<void> {
        for (const c of [this.caughtMessages, this.observedMessages, this.errors]) {
            await c.createIndex({"id": 1}, {unique: true});
            await c.createIndex({"source.namespace": 1});
            await c.createIndex({"expires": 1}, {expireAfterSeconds: 0});
        }
    }

    public async logCaughtMessage(source: SourceReference, message: Message, policy: CatchPolicy): Promise<void> {
        const sourceCopy = {...source};

        if (sourceCopy.labels !== undefined) {
            sourceCopy.labels = mapLabelsForMongodb(sourceCopy.labels);
        }

        const doc: StoredMessage = {id: uuid.v4(), source: sourceCopy, ...message};

        if (policy.retention !== undefined) {
            doc.expires = new Date(new Date().getTime() + policy.retention * 86400000);
        }

        await this.caughtMessages.insertOne(doc);
        debug("stored message: %o", doc);
    }

    public async logForwardedMessage(source: SourceReference, message: Message, policy: ForwardPolicy): Promise<void> {
        const sender = anonymizeEmailAddress(message.envelope.mailFrom);
        const recipients = message.envelope.rcptTo.map(anonymizeEmailAddress);

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

        await this.observedMessages.insertOne(doc);
    }

    public async logError(source: SourceReference, message: Message, error: string, policy: ForwardPolicy): Promise<void> {
        const sourceCopy = {...source};

        if (sourceCopy.labels !== undefined) {
            sourceCopy.labels = mapLabelsForMongodb(sourceCopy.labels);
        }

        const doc: StoredError = {
            id: uuid.v4(),
            source: sourceCopy,
            error,
            message,
            expires: new Date(new Date().getTime() + (policy.errors.retention || 3) * 86400000)
        };

        await this.errors.insertOne(doc);
        debug("stored error: %o", doc);
    }

    public async retrieveCaughtMessages(query: Query, opts?: RetrieveOptions): Promise<RetrieveResult> {
        const q: any = {"source.namespace": query.namespace};
        const {limit = 100, offset = 0} = opts || {};

        if (query.podName) {
            q["source.podName"] = query.podName;
        }

        if (query.labelSelector) {
            for (const k of Object.keys(query.labelSelector)) {
                const mapped = k.replace(".", "~");
                q[`source.labels.${mapped}`] = query.labelSelector[k];
            }
        }

        const totalCount = await this.caughtMessages.countDocuments(q, {});
        const items = await this.caughtMessages.find(q).limit(limit).skip(offset).map(addMissingIDs).toArray();

        return {
            totalCount,
            items,
        }
    }

    public async retrieveErrors(query: Query, opts?: RetrieveOptions): Promise<ErrorListResult> {
        const q: any = {"source.namespace": query.namespace};
        const {limit = 100, offset = 0} = opts || {};

        if (query.podName) {
            q["source.podName"] = query.podName;
        }

        if (query.labelSelector) {
            for (const k of Object.keys(query.labelSelector)) {
                const mapped = k.replace(".", "~");
                q[`source.labels.${mapped}`] = query.labelSelector[k];
            }
        }

        const totalCount = await this.errors.countDocuments(q, {});
        const items = await this.errors.find(q).limit(limit).skip(offset).toArray();

        return {
            totalCount,
            items,
        };
    }

    public retrieveCaughtMessageStream(query: Query, opts?: RetrieveStreamOptions): TypedStream<StoredMessage> {
        const {onlyNew = false} = opts || {};
        const q: any = {"source.namespace": query.namespace};
        const streamQ: any = {"fullDocument.source.namespace": query.namespace};

        if (query.podName) {
            q["source.podName"] = streamQ["fullDocument.source.podName"] = query.podName;
        }

        if (query.labelSelector) {
            for (const k of Object.keys(query.labelSelector)) {
                const mapped = k.replace(".", "~");
                q[`source.labels.${mapped}`] = streamQ[`fullDocument.source.labels.${mapped}`] = query.labelSelector[k];
            }
        }

        const outputStream = new Stream();

        const streamChanges = () => {
            const changeStream = this.caughtMessages.watch([
                {$match: streamQ}
            ], {fullDocument: "updateLookup"});

            changeStream.next((err, next) => {
                if (err) {
                    debug("error on change stream: %o", err);

                    outputStream.emit("error", err);
                    return;
                }

                debug("received change: %o", next);

                if (next.operationType === "insert") {
                    outputStream.emit("data", addMissingIDs(next.fullDocument));
                }

                if (next.operationType === "invalidate") {
                    outputStream.emit("end");
                }
            });
        };

        if (!onlyNew) {
            const items = this.caughtMessages.find(q).map(addMissingIDs).stream();

            items.on("data", d => outputStream.emit("data", d));
            items.on("error", err => outputStream.emit("err", err));
            items.on("end", () => {
                debug("find has ended; now streaming changes");
                streamChanges();
            })
        } else {
            streamChanges();
        }

        return outputStream;
    }

    public async retrieveForwardingSummary(query: Query): Promise<SummarizeResults> {
        const q = {
            "source.namespace": query.namespace,
            "date": {$gte: query.from},
        };

        const results = await this.observedMessages.aggregate([
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