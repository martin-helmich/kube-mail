import {Application} from "express";
import * as express from "express";
import {register} from "prom-client";
import { Server } from "http";

const debug = require("debug")("kubemail:monitoring");

export class MonitoringServer {
    private app: Application;
    private server?: Server;

    public constructor() {
        this.app = express();

        this.app.get("/readiness", (req, res) => {
            res.status(204).end();
        });

        this.app.get("/status", (req, res) => {
            res.status(204).end();
        });

        this.app.get("/metrics", (req, res) => {
            res.send(register.metrics());
        })
    }

    public listen(port: number) {
        debug("starting monitoring server on port %o", port);
        this.server = this.app.listen(port, () => {
            debug("monitoring server started");
        })
    }

    public close(): Promise<void> {
        return new Promise((res, rej)=> {
            if (this.server) {
                this.server.close(err => {
                    if (err) {
                        rej(err);
                    } else {
                        res();
                    }
                });
            } else {
                res();
            }
        })
    }
}
