export type Config = {
    rest: APIConfig;
    grpc: APIConfig;

    sink: SinkConfig;
    policy: PolicyConfig;
}

export type APIConfig = {
    enabled: boolean;
    port: number;
}

export type SinkConfig = {
    type: "mongodb";
    mongodb: {
        /** @deprecated */
        collection: string;

        collections?: {
            caughtEmails?: string;
            observedEmails?: string;
            errors?: string;
        }
    }
};

export type PolicyConfig = {
    provider: "kubernetes",
    kubernetes: {
        inCluster: true
    } | {
        inCluster?: false;
        config: string;
    }
};