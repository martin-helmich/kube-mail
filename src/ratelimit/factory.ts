import {RateLimiterConfig} from "../config";
import {RateLimiter} from "./ratelimiter";
import * as IORedis from "ioredis";
import {RedisRateLimiter} from "./ratelimiter_redis";

function forceNumber(i: number | string): number {
    if (typeof i === "string") {
        return parseInt(i, 10);
    }

    return i;
}

export function buildRatelimiterFromConfig(c: RateLimiterConfig): RateLimiter {
    if (c.redis.sentinel?.host) {
        const {sentinel} = c.redis;
        const client = new IORedis({
            sentinelPassword: c.redis.password,
            sentinels: [{host: sentinel.host, port: forceNumber(sentinel.port)}],
            name: sentinel.masterSet,
        });

        return new RedisRateLimiter(client);
    }

    const client = new IORedis({
        host: c.redis.host,
        port: forceNumber(c.redis.port),
        password: c.redis.password,
    });

    return new RedisRateLimiter(client);
}
