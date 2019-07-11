export type Config = {
    rest: APIConfig;
    grpc: APIConfig;

    elasticsearch: ElasticSearchConfig;
    sink: SinkConfig;
    recorder: RecorderConfig;
    policy: PolicyConfig;
    watcher?: WatcherConfig;
}

export type APIConfig = {
    enabled: boolean;
    port: number;
}

export type ElasticSearchConfig = {
    host: string;
};

export type SinkConfig = {
    type: "elasticsearch";
    elasticsearch: {
        index: string;
    };
} | {
    type: "mongodb";
    mongodb: {
        collection: string;
    }
};

export type RecorderConfig = {
    type: "elasticsearch",
    elasticsearch: {
        index: string
    }
} | {
    type: "mongodb";
    mongodb: {
        collection: string;
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

export interface WatcherConfig {
    emailPolicyInformer?: InformerConfig;
    podInformer?: InformerConfig;
}

export interface InformerConfig {
    selector: InformerConfigSelector;
};

export interface InformerConfigSelector {
    [s: string]: string;
};
