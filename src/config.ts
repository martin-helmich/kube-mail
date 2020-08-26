export type Config = {
    policy: PolicyConfig;
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
