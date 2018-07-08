import {Readable, Stream} from "stream";

export const readStreamIntoBuffer = (stream: Readable): Promise<Buffer> => {
    return new Promise((res, rej) => {
        const buffers: Buffer[] = [];

        stream.on("data", chunk => {
            if (!(chunk instanceof Buffer)) {
                chunk = Buffer.from(chunk, "utf-8");
            }
            buffers.push(chunk);
        });

        stream.on("end", () => {
            res(Buffer.concat(buffers));
        });

        stream.on("error", rej);
    });
};

export declare class TypedStream<T> extends Stream {
    on(event: "data", callback: (obj: T) => any): any;
    on(event: "end", callback: () => any): any;
}
