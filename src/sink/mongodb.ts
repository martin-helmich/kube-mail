import {
    Message, Query, RealtimeSink, RetrieveOptions, RetrieveResult, RetrieveStreamOptions,
    StoredMessage
} from "./interface";
import {CatchPolicy, SourceReference} from "../policy/provider";
import {TypedStream} from "../util";
import {Collection} from "mongodb";
import {Stream} from "stream";

const debug = require("debug")("kubemail:sink:mongodb");

export const mapLabelsForMongodb = (input: {[k: string]: string}): {[k:string]: string} => {
    const output: {[k:string]: string} = {};
    for (const k of Object.keys(input)) {
        const mapped = k.replace(".", "~");
        output[mapped] = input[k];
    }
    return output;
};

export class MongodbSink implements RealtimeSink {

    public constructor(private collection: Collection) {
    }

    public async setup(): Promise<void> {
        await this.collection.createIndex({"source.namespace": 1});
        await this.collection.createIndex({"expires": 1}, {expireAfterSeconds: 0});
        return;
    }

    public async storeMessage(source: SourceReference, message: Message, policy: CatchPolicy): Promise<void> {
        const sourceCopy = {...source};

        if (sourceCopy.labels !== undefined) {
            sourceCopy.labels = mapLabelsForMongodb(sourceCopy.labels);
        }

        const doc: StoredMessage = {source: sourceCopy, ...message};

        if (policy.retention !== undefined) {
            doc.expires = new Date(new Date().getTime() + policy.retention * 86400000);
        }

        await this.collection.insertOne(doc);
        debug("stored message: %o", doc);
    }

    public async retrieveMessages(query: Query, opts?: RetrieveOptions): Promise<RetrieveResult> {
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

        const totalCount = await this.collection.countDocuments(q, {});
        const messages = await this.collection.find(q).limit(limit).skip(offset).toArray();

        return {
            totalCount,
            messages,
        }
    }

    public retrieveMessageStream(query: Query, opts?: RetrieveStreamOptions): TypedStream<StoredMessage> {
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
            const changeStream = this.collection.watch([
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
                    outputStream.emit("data", next.fullDocument);
                }

                if (next.operationType === "invalidate") {
                    outputStream.emit("end");
                }
            });
        };

        if (!onlyNew) {
            const items = this.collection.find(q).stream();

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

}