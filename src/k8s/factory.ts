import {PolicyConfig} from "../config";
import {
    FileBasedConfig, IKubernetesAPI, IKubernetesClientConfig, InClusterConfig, KubernetesAPI, KubernetesRESTClient,
    MonitoringKubernetesRESTClient
} from "@mittwald/kubernetes";
import {KubemailCustomResourceAPI} from "./api";
import {Registry} from "prom-client";

export const buildKubernetesClientFromConfig = (cfg: PolicyConfig, registry: Registry): IKubernetesAPI & KubemailCustomResourceAPI => {
    let config: IKubernetesClientConfig;

    if (cfg.kubernetes.inCluster) {
        config = new InClusterConfig();
    } else {
        config = new FileBasedConfig(cfg.kubernetes.config);
    }

    const client = new MonitoringKubernetesRESTClient(
        new KubernetesRESTClient(
            config,
            {debugFn: require("debug")("k8s:client")}
        ),
        registry
    );

    return new KubernetesAPI(client, registry)
        .extend("kubemail", new KubemailCustomResourceAPI(client, registry));
};