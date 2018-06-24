import {MetadataObject} from "@mittwald/kubernetes/types/meta";
import {INamespacedResourceClient} from "@mittwald/kubernetes";

interface CacheEntry<R extends MetadataObject> {
    entry: R;
    until: Date;
}

export interface Store<R extends MetadataObject> {
    store(obj: R): void
    get(namespace: string, name: string): Promise<R|undefined>
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

    public async get(namespace: string, name: string): Promise<R|undefined> {
        return this.objects.get(`${namespace}/${name}`);
    }
}

export class CachingLookupStore<R extends MetadataObject> implements Store<R> {
    private cache = new Map<string, CacheEntry<R>>();

    public constructor(private api: INamespacedResourceClient<R, any, any>) {
    }

    store(obj: R): void {
        // no-op
    }

    public async get(namespace: string, name: string): Promise<R | undefined> {
        const key = `${namespace}/${name}`;

        if (this.cache.has(key)) {
            const entry = this.cache.get(key)!;
            if (entry.until > new Date()) {
                return entry.entry;
            }
        }

        const result = await this.api.namespace(namespace).get(name);

        if (result) {
            const exp = new Date();
            exp.setSeconds(exp.getSeconds() + 3600);

            this.cache.set(key, {
                entry: result,
                until: exp,
            });
        }

        return result;
    }

    pull(obj: R): void {
        // no-op
    }

}