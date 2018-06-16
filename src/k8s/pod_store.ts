import {Store} from "./informer";
import {PodWithStatus} from "@mittwald/kubernetes/types/core/v1";

export class PodStore implements Store<PodWithStatus> {
    private podsByIP = new Map<string, PodWithStatus>();
    private podsByName = new Map<string, PodWithStatus>();

    public store(obj: PodWithStatus): void {
        this.podsByName.set(`${obj.metadata.namespace}/${obj.metadata.name}`, obj);

        if (obj.status.podIP) {
            this.podsByIP.set(obj.status.podIP, obj);
        }
    }

    public get(namespace: string, name: string): PodWithStatus | undefined {
        return this.podsByName.get(namespace + "/" + name);
    }

    public getByPodIP(podIP: string): PodWithStatus|undefined {
        return this.podsByIP.get(podIP);
    }

    public pull(obj: PodWithStatus): void {
        this.podsByName.delete(`${obj.metadata.namespace}/${obj.metadata.name}`);
        this.podsByIP.delete(obj.status.podIP);
    }
}