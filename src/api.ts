import * as express from "express";
import {Application, Request, Response} from "express";
import {Sink} from "./sink/interface";

const debug = require("debug")("kubemail:api");

export interface APIServerOptions {
    sink: Sink;
}

export class APIServer {
    private app: Application;
    private sink: Sink;

    public constructor(private options: APIServerOptions) {
        this.app = express();
        this.sink = options.sink;

        this.app.get("/v1/sources/:namespace/caught", async (req, res: Response) => {
            const {namespace} = req.params;
            const {limit = 100, offset = 0} = req.query;
            const result = await this.sink.retrieveCaughtMessages({namespace}, {limit, offset});
            const messages = result.items;

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
            const from = new Date(new Date().getTime() - 86400000 * 7);
            const result = await this.sink.retrieveForwardingSummary({namespace, from});

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