import {SMTPServer} from "smtp-server";
import {readStreamIntoBuffer} from "./util";
import * as express from "express";

const handleInterrupt = () => process.exit(0);
const mails: any[] = [];

const app = express();
const server = new SMTPServer({
    authOptional: true,
    secure: false,
    async onData(stream, session, callback) {
        const content = await readStreamIntoBuffer(stream);
        const {envelope} = session;

        console.log("mailFrom: " + JSON.stringify(envelope.mailFrom));
        console.log("rcptTo: " + JSON.stringify(envelope.rcptTo));
        console.log(content.toString("base64"));

        mails.push({
            mailFrom: envelope.mailFrom,
            rcptTo: envelope.rcptTo,
            body: content.toString("utf-8"),
        });

        callback();
    }
});

app.get("/emails", (req, res) => {
    res.json(mails);
});

process.on("SIGINT", handleInterrupt);
process.on("SIGTERM", handleInterrupt);

app.listen(8080);
server.listen(1025);
