import {MetadataObject} from "@mittwald/kubernetes/types/meta";
import {IResourceClient} from "@mittwald/kubernetes";
import {LabelSelector} from "@mittwald/kubernetes/label";
import {WatchEvent} from "@mittwald/kubernetes/types/meta/v1";

const debug = require("debug")("kubemail:informer");

export interface Controller {
    waitForInitialList(): Promise<void>
    stop(): void
}

export interface Store<R extends MetadataObject> {
    store(obj: R): void
    get(namespace: string, name: string): R|undefined
    pull(obj: R): void
}

export class InMemoryStore<R extends MetadataObject> implements Store<R> {
    private objects = new Map<string, R>();

    public store(obj: R) {
        this.objects.set(`${obj.metadata.namespace}/${obj.metadata.name}`, obj);
    }

    public pull(obj: R) {
        this.objects.delete(`${obj.metadata.namespace}/${obj.metadata.name}`);
    }

    public get(namespace: string, name: string): R|undefined {
        return this.objects.get(`${namespace}/${name}`);
    }
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