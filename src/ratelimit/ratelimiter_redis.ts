import {RateLimiter} from "./ratelimiter";
import {Policy, RateLimitPolicy} from "../policy/provider";
import Redis from "ioredis";

const keyForPolicy = (p: Policy) => `rl_${p.id}`;

const ttlForRL = (r: RateLimitPolicy) => {
    switch (r.limitPeriod) {
        case "hour":
            return 3600;
        case "minute":
            return 60;
        default:
            throw new Error(`unsupported period: ${r.limitPeriod}`);
    }
}

export class RedisRateLimiter implements RateLimiter {
    private readonly client: Redis;

    public constructor(redis: Redis) {
        this.client = redis;
    }

    public async take(policy: Policy, amount: number): Promise<boolean> {
        const {ratelimit} = policy;

        if (!ratelimit) {
            return true;
        }

        const key = keyForPolicy(policy);
        const currentCounter = await this.client.get(key);

        if (currentCounter !== null && (parseInt(currentCounter, 10) + amount) > ratelimit.maximum) {
            return false;
        }

        const incremented = await this.client.incrby(key, amount);

        if (incremented === amount) {
            const ttl = ttlForRL(ratelimit);
            await this.client.expire(key, ttl);
        }

        return true;
    }

}
