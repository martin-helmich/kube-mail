import {MetadataObject} from "@mittwald/kubernetes/types/meta";
import {IResourceClient} from "@mittwald/kubernetes";
import {LabelSelector} from "@mittwald/kubernetes/label";
import {WatchEvent} from "@mittwald/kubernetes/types/meta/v1";
import {InMemoryStore, Store} from "./store";

const debug = require("debug")("kubemail:informer");

export interface Controller {
    waitForInitialList(): Promise<void>
    stop(): void
}

export class Informer<R extends MetadataObject> {
    public readonly store: Store<R>;

    public constructor(private resource: IResourceClient<R, any, any>,
                       private labelSelector?: LabelSelector,
                       store?: Store<R>,
                       ) {
        this.store = store || new InMemoryStore();
    }

    public start(): Controller {
        const handler = (event: WatchEvent<R>) => {
            const {type, object} = event;

            switch (type) {
                case "ADDED":
                case "MODIFIED":
                    debug("added or updated object %o: %o", (object as any).kind, `${object.metadata.namespace}/${object.metadata.name}`);
                    this.store.store(object);
                    break;
                case "DELETED":
                    debug("removed object %o: %s", (object as any).kind, `${object.metadata.namespace}/${object.metadata.name}`);
                    this.store.pull(object);
                    break;
            }
        };

        const watchHandle = this.resource.listWatch(handler, undefined, {labelSelector: this.labelSelector});

        return {
            waitForInitialList: () => watchHandle.initialized,
            stop: watchHandle.stop,
        };
    }

}