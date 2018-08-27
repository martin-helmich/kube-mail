import {SinkConfig} from "../config";
import {Sink} from "./interface";
import {MongodbSink} from "./mongodb";
import {Db} from "mongodb";

export const buildSinkFromConfig = (cfg: SinkConfig, mongoDbConnection?: Db): Sink => {
    switch (cfg.type) {
        case "mongodb":
            if (!mongoDbConnection) {
                throw new Error("MongoDB connection must be provided");
            }

            const {caughtEmails = "caughtEmails", observedEmails = "observedEmails", errors = "errors"} = cfg.mongodb.collections || {};

            const caught = mongoDbConnection.collection(cfg.mongodb.collection || caughtEmails);
            const observed = mongoDbConnection.collection(observedEmails);
            const errorCollection = mongoDbConnection.collection(errors);

            return new MongodbSink(caught, observed, errorCollection);

        default:
            throw new Error(`unsupported sink type: '${(cfg as any).type}'`);
    }
};