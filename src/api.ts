import * as express from "express";
import {Application, Request, Response} from "express";
import {Sink} from "./sink/interface";
import {StatisticsRecorder} from "./stats/recorder";

const debug = require("debug")("kubemail:api");

export interface APIServerOptions {
    sink: Sink;
    recorder: StatisticsRecorder;
}

export class APIServer {
    private app: Application;
    private sink: Sink;
    private recorder: StatisticsRecorder;

    public constructor(private options: APIServerOptions) {
        this.app = express();
        this.sink = options.sink;
        this.recorder = options.recorder;

        this.app.get("/v1/sources/:namespace/caught", async (req, res: Response) => {
            const {namespace} = req.params;
            const {limit = 100, offset = 0} = req.query;
            const result = await this.sink.retrieveMessages({namespace}, {limit, offset});
            const messages = result.messages;

            res.setHeader("Content-Type", "application/json-seq");
            res.setHeader("X-Pagination-Total", await result.totalCount);
            res.setHeader("X-Pagination-Limit", limit);
            res.setHeader("X-Pagination-Offset", offset);

            messages.forEach(msg => {
                res.write('\x1e' +JSON.stringify(msg) + '\n');
            });

            res.end();
        });

        this.app.get("/v1/sources/:namespace/stats", async (req: Request, res: Response) => {
            const {namespace} = req.params;
            const {tz: timezone = "Europe/Berlin"} = req.query;
            const from = new Date(new Date().getTime() - 86400000 * 7);
            const result = await this.recorder.summarize({namespace, from}, {timezone});

            debug("serving result %O", result);

            res.json(result);
        });
    }

    public listen(port: number) {
        debug("starting API on port %o", port);
        this.app.listen(port, () => {
            debug("API started");
        })
    }
}