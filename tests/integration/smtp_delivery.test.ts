import {FileBasedConfig, IKubernetesAPI, KubernetesAPI, KubernetesRESTClient} from "@mittwald/kubernetes";
import {KubemailCustomResourceAPI, KubemailCustomResourceAPIInterface} from "../../src/k8s/api";
import {Registry} from "prom-client";
import {PodWithStatus} from "@mittwald/kubernetes/types/core/v1";
import {ObjectMeta} from "@mittwald/kubernetes/types/meta/v1";
import axios from "axios";

describe("SMTP delivery", () => {
    const config = new FileBasedConfig("./kind-kubeconfig");
    const client = new KubernetesRESTClient(config);
    const registry = new Registry();
    const api: IKubernetesAPI & KubemailCustomResourceAPIInterface = new KubernetesAPI(client, registry)
        .extend("kubemail", new KubemailCustomResourceAPI(client, registry));

    jest.setTimeout(300 * 1000);

    const sleep = (t: number) => new Promise(res => setTimeout(res, t));
    const waitUntilPodCompletion = async (pod: PodWithStatus) => {
        while (pod.status.phase !== "Succeeded") {
            await sleep(1000);
            const updatedPod = await api.core().v1().pods().namespace(pod.metadata.namespace!).get(pod.metadata.name);

            if (!updatedPod) {
                throw new Error("pod was deleted");
            }

            if (updatedPod.status.phase === "Failed") {
                throw new Error("pod has failed");
            }

            pod = updatedPod;
        }
    }
    const waitUntilPodFailure = async (pod: PodWithStatus) => {
        while (pod.status.phase !== "Failed") {
            await sleep(1000);
            const updatedPod = await api.core().v1().pods().namespace(pod.metadata.namespace!).get(pod.metadata.name);

            if (!updatedPod) {
                throw new Error("pod was deleted");
            }

            if (updatedPod.status.phase === "Succeeded") {
                throw new Error("pod has succeeded");
            }

            pod = updatedPod;
        }
    }

    const sendMailFromPod = async (to: string, labels: Record<string, string>): Promise<PodWithStatus> => {
        return await api.core().v1().pods().namespace("default").post({
            metadata: {
                generateName: "tester-",
                labels,
            } as any as ObjectMeta,
            spec: {
                restartPolicy: "Never",
                containers: [{
                    name: "tester",
                    image: "alpine:latest",
                    command: ["sh", "-c"],
                    args: [`apk add -U ssmtp && ln -sf /etc/kube-ssmtp/ssmtp.conf /etc/ssmtp/ssmtp.conf && sleep 3 && echo "Hello World!" | ssmtp -vvv ${to}`],
                    volumeMounts: [{
                        name: "ssmtp-config",
                        mountPath: "/etc/kube-ssmtp",
                        readOnly: true,
                    }]
                }],
                volumes: [{
                    name: "ssmtp-config",
                    configMap: {
                        name: "tester-ssmtp"
                    }
                }]
            }
        });
    }

    const mailWasSentFromRecipient = async (from: string): Promise<boolean> => {
        const response = await axios.get("http://localhost:8080/emails");
        const data: Array<{mailFrom: {address: string}}> = response.data;
        const mail = data.find((a: any) => a.mailFrom.address === from);

        return !!mail;
    }

    test("mail from Pod matching policy is delivered", async () => {
        const pod = await sendMailFromPod("test@kube-mail.example", {"foo": "bar"});

        await waitUntilPodCompletion(pod);
        await sleep(3);

        await expect(mailWasSentFromRecipient(`root@${pod.metadata.name}`)).resolves.not.toBeFalsy();
    });

    test("mail from Pod NOT matching policy is not delivered", async () => {
        const pod = await sendMailFromPod("test@kube-mail.example", {"foo": "baz"});

        await waitUntilPodFailure(pod);
        await sleep(3);

        await expect(mailWasSentFromRecipient(`root@${pod.metadata.name}`)).resolves.toBeFalsy();
    });

    test("metrics are exported", async () => {
        const response = await axios.get("http://localhost:9100/metrics");

        expect(response.data).toContain(`kubemail_received_emails{policy="default/default",server="default/default-smtp"}`);
    })
});
