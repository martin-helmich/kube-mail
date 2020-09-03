export type Config = {
    policy: PolicyConfig;
    rateLimiter: RateLimiterConfig;
    watcher?: IIWatcherConfig;
}

export type PolicyConfig = {
    provider: "kubernetes",
    kubernetes: {
        static?: string;
    } & ({
        inCluster: true
    } | {
        inCluster?: false;
        config: string;
    })
};

export type RateLimiterConfig = {
    redis: {
        host: string;
        port: number | string;
        password?: string;
        sentinel?: {
            host: string;
            port: number | string;
            masterSet: string;
        }
    };
}

export interface IIWatcherConfig {
    emailPolicyInformer?: IInformerConfig;
    podInformer?: IInformerConfig;
}

export interface IInformerConfig {
    selector?: IInformerConfigSelector;
}

export interface IInformerConfigSelector {
    [s: string]: string;
}
