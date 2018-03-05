import {Message, RetrieveOptions, RetrieveResult, Sink} from "./interface";
import {Client} from "elasticsearch";
import {SourceReference} from "../policy/provider";
import {TypedStream} from "../util";
import {Stream} from "stream";
import uuid = require("uuid");

const debug = require("debug")("sink:elasticsearch");

export interface ElasticsearchSinkOptions {
    index: string;
    type: string;
}

const defaultOpts: ElasticsearchSinkOptions = {
    index: "kubemail",
    type: "message",
};

export class ElasticsearchSink implements Sink {

    private options: ElasticsearchSinkOptions;

    public constructor(private client: Client, options: Partial<ElasticsearchSinkOptions> = {}) {
        this.options = {...defaultOpts, ...options};
    }

    public async setup() {
        const {index, type} = this.options;

        debug("starting setup");

        const addrMapping = {
            properties: {
                value: {
                    type: "nested",
                    properties: {
                        address: {type: "keyword"},
                        name: {type: "keyword"},
                    }
                }
            }
        };

        const mapping = {
            properties: {
                sourceID: {
                    type: "keyword",
                },
                date: {
                    type: "date",
                },
                envelope: {
                    properties: {
                        mailFrom: {type: "keyword"},
                        rcptTo: {type: "keyword"},
                    }
                },
                mail: {
                    properties: {
                        headers: {
                            properties: {
                                from: addrMapping,
                                to: addrMapping,
                            }
                        },
                        html: {type: "boolean"},
                        subject: {
                            type: "text",
                        },
                        text: {
                            type: "text",
                        },
                        from: addrMapping,
                        to: addrMapping,
                    }
                }
            }
        };

        const exists = await this.client.indices.exists({index});

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

    public async storeMessage(source: SourceReference, message: Message): Promise<void> {
        const {index, type} = this.options;

        debug("storing message in elasticsearch");

        if (message.mail.attachments) {
            for (const a of message.mail.attachments) {
                debug("discarding %o attachment", a.contentType);
                a.content = Buffer.alloc(0);
            }
        }

        const response = await this.client.create({
            index,
            type,
            id: uuid.v4(),
            body: {sourceID: source.identifier, ...message},
        });

        debug("stored message: %o", response);

        return;
    }

    public async retrieveMessages(source: SourceReference, options: RetrieveOptions = {}): Promise<RetrieveResult> {
        const {index, type} = this.options;
        const {limit = 100, offset = 0} = options;
        const stream = new Stream();

        debug("querying for source %o", source);

        const result = await this.client.search({
            index,
            type,
            from: offset,
            size: limit,
            body: {
                query: {
                    term: {
                        sourceID: source.identifier,
                    }
                }
            }
        });

        return {
            messages: result.hits.hits.map(d => d._source as Message),
            totalCount: result.hits.total,
        };
    }

}