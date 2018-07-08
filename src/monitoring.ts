import {Application} from "express";
import * as express from "express";

const debug = require("debug")("kubemail:monitoring");

export class MonitoringServer {
    private app: Application;

    public constructor() {
        this.app = express();

        this.app.get("/readiness", (req, res) => {
            res.status(204).end();
        });

        this.app.get("/status", (req, res) => {
            res.status(204).end();
        });
    }

    public listen(port: number) {
        debug("starting monitoring server on port %o", port);
        this.app.listen(port, () => {
            debug("monitoring server started");
        })
    }
}