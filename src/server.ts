import {register} from "prom-client";
import * as config from "config";
import {IInformerConfig, PolicyConfig} from "./config";
import {main} from "./main";

main(
    config.get<PolicyConfig>("policy"),
    config.get<IInformerConfig>('watcher.emailPolicyInformer'),
    config.get<IInformerConfig>('watcher.podInformer'),
    register,
).catch(err => {
    console.error(err);
    process.exit(1);
});
