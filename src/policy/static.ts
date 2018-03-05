import {Policy, PolicyProvider} from "./provider";

export class StaticPolicyProvider implements PolicyProvider {

    public constructor(private policy: Policy) {

    }

    public async getByClientIP(clientIP: string): Promise<Policy | undefined> {
        return this.policy;
    }
}