import {Policy} from "../policy/provider";

export interface RateLimiter {
    take(policy: Policy, amount: number): Promise<boolean>;
}
