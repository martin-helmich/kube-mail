import {Pod, PodWithStatus} from "@mittwald/kubernetes/types/core/v1";
import {Store} from "./store";
import {INamespacedResourceClient} from "@mittwald/kubernetes";

export class PodStore implements Store<PodWithStatus> {
    private podsByIP = new Map<string, PodWithStatus>();
    private podsByName = new Map<string, PodWithStatus>();

    public constructor(private inner: Store<PodWithStatus>, private podClient: INamespacedResourceClient<Pod, any, any, PodWithStatus>) {
    }


    public store(obj: PodWithStatus): void {
        this.podsByName.set(`${obj.metadata.namespace}/${obj.metadata.name}`, obj);

        if (obj.status.podIP) {
            this.podsByIP.set(obj.status.podIP, obj);
        }
    }

    public async get(namespace: string, name: string): Promise<PodWithStatus | undefined> {
        const fromCache = this.podsByName.get(namespace + "/" + name);
        if (fromCache) {
            return fromCache;
        }

        const fromInner = await this.inner.get(namespace, name);
        if (fromInner) {
            this.store(fromInner);
        }

        return fromInner;
    }

    public async getByPodIP(podIP: string): Promise<PodWithStatus|undefined> {
        const fromCache = this.podsByIP.get(podIP);
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

    public pull(obj: PodWithStatus): void {
        this.podsByName.delete(`${obj.metadata.namespace}/${obj.metadata.name}`);
        this.podsByIP.delete(obj.status.podIP);
    }
}