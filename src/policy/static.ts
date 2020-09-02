import {Policy, PolicyProvider} from "./provider";
import {PodWithStatus} from "@mittwald/kubernetes/types/core/v1";

export class StaticPolicyProvider implements PolicyProvider {

    public constructor(private policy: Policy) {

    }

    public async getByClientIP(clientIP: string): Promise<[Policy | undefined, PodWithStatus | undefined]> {
        return [this.policy, undefined];
    }
}
