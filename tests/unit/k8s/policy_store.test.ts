import {EmailPolicy} from "../../../src/k8s/types/v1alpha1/emailpolicy";
import {PolicyStore} from "../../../src/k8s/policy_store";

describe("PolicyStore", () => {
    const defaultPolicy: EmailPolicy = {
        metadata: {name: "default", namespace: "default"},
        spec: {
            default: true,
            sink: {
                smtp: {
                    credentials: {name: "default-smtp"},
                    server: {name: "default-smtp"},
                },
            }
        }
    };

    const fooPolicy: EmailPolicy = {
        metadata: {name: "foo", namespace: "default"},
        spec: {
            podSelector: {matchLabels: {"foo": "bar"}},
            sink: {
                smtp: {
                    credentials: {name: "default-smtp"},
                    server: {name: "default-smtp"},
                },
            }
        }
    };

    const barPolicy: EmailPolicy = {
        metadata: {name: "bar", namespace: "default"},
        spec: {
            podSelector: {matchLabels: {"bar": "123", "baz": "321"}},
            sink: {
                smtp: {
                    credentials: {name: "default-smtp"},
                    server: {name: "default-smtp"},
                },
            }
        }
    };

    let store: PolicyStore;

    beforeEach(() => {
        store = new PolicyStore();

        [defaultPolicy, fooPolicy, barPolicy].forEach(store.store.bind(store));
    });

    test("policies can be inserted and retrieved", async () => {
        await expect(store.get("default", "default")).resolves.toBe(defaultPolicy);
        await expect(store.get("default", "foo")).resolves.toBe(fooPolicy);
        await expect(store.get("default", "bar")).resolves.toBe(barPolicy);
    });

    test("can select policy based on namespace selector with single selected label", () => {
        const labels = {"foo": "bar", "bar": "baz"};
        const match = store.match("default", labels);

        expect(match).toHaveLength(1);
        expect(match[0]).toBe(fooPolicy);
    });


    test("can select policy based on namespace selector outside of namespace", () => {
        const labels = {"foo": "bar", "bar": "baz"};
        const match = store.match("other", labels);

        expect(match).toHaveLength(1);
        expect(match[0]).toBe(defaultPolicy);
    });

    test("can select policy based on namespace selector with multiple selected label", () => {
        const labels = {"bar": "123", "baz": "321"};
        const match = store.match("default", labels);

        expect(match).toHaveLength(1);
        expect(match[0]).toBe(barPolicy);
    });
});
