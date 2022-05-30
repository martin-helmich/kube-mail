import {Pod, PodWithStatus} from "@mittwald/kubernetes/types/core/v1";
import {INamespacedResourceClient} from "@mittwald/kubernetes";
import {Store} from "@mittwald/kubernetes/cache";

class PodStoreCacheSet {
    private podsByIP = new Map<string, PodWithStatus>();
    private podsByName = new Map<string, PodWithStatus>();

    public store(obj: PodWithStatus) {
        this.podsByName.set(`${obj.metadata.namespace}/${obj.metadata.name}`, obj);

        if (obj.status.podIP) {
            this.podsByIP.set(obj.status.podIP, obj);
        }
    }

    public pull(obj: PodWithStatus) {
        this.podsByName.delete(`${obj.metadata.namespace}/${obj.metadata.name}`);
        this.podsByIP.delete(obj.status.podIP);
    }

    public getByName(namespace: string, name: string): PodWithStatus | undefined {
        return this.podsByName.get(`${namespace}/${name}`);
    }

    public getByIP(ip: string): PodWithStatus | undefined {
        return this.podsByIP.get(ip);
    }
}

export type PodPredicate = (pod: PodWithStatus) => boolean

export const PodPredicates = {
    Any: (p: PodWithStatus) => true,
    OnlyRunning: (p: PodWithStatus) => p.status.phase === "Running",
}

export class PodStore implements Store<PodWithStatus> {
    private cache = new PodStoreCacheSet();
    private readonly predicate: PodPredicate;

    public constructor(private inner: Store<PodWithStatus>, private podClient: INamespacedResourceClient<Pod, any, any, PodWithStatus>, predicate = PodPredicates.Any) {
        this.predicate = predicate;
    }

    public async store(obj: PodWithStatus): Promise<void> {
        if (this.predicate(obj)) {
            this.cache.store(obj);
        } else {
            this.cache.pull(obj);
        }
    }

    public async sync(pods: PodWithStatus[]): Promise<void> {
        const newCache = new PodStoreCacheSet()

        for (const pod of pods.filter(this.predicate)) {
            newCache.store(pod);
        }

        this.cache = newCache;
    }

    public async get(namespace: string, name: string): Promise<PodWithStatus | undefined> {
        const fromCache = this.cache.getByName(namespace, name);
        if (fromCache) {
            return fromCache;
        }

        const fromInner = await this.inner.get(namespace, name);
        if (fromInner) {
            this.store(fromInner);
        }

        return fromInner;
    }

    public async getByPodIP(podIP: string): Promise<PodWithStatus | undefined> {
        const fromCache = this.cache.getByIP(podIP);
        if (fromCache) {
            return fromCache;
        }

        const fromAPI = await this.podClient.allNamespaces().list({fieldSelector: {"status.podIP": podIP}});
        if (fromAPI.length === 0) {
            return undefined;
        }

        const pod = fromAPI[0];
        this.store(pod);
        return pod;
    }

    public async pull(obj: PodWithStatus): Promise<void> {
        this.cache.pull(obj);
    }
}