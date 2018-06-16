import {Store} from "./informer";
import {EmailPolicy} from "./types/v1alpha1/emailpolicy";
import {MetadataObject} from "@mittwald/kubernetes/types/meta";
const debug = require("debug")("kubemail:policystore");

type Label = {key: string, value: string, combined: string};

const name = (p: EmailPolicy) => `${p.metadata.namespace}/${p.metadata.name}`;
const orderedLabels = (input: {[key: string]: string}): Label[] =>
    Object.keys(input).sort().map(key => ({key, value: input[key], combined: key + "=" + input[key]}));

class SearchTreeNode<E extends MetadataObject> {
    public subNodes: {[labelAndValue: string]: SearchTreeNode<E>} = {};

    public constructor(public values: E[] = []) {
    }

    public remove(obj: E) {
        this.values = this.values.filter(e => !(e.metadata.namespace === obj.metadata.namespace && e.metadata.name === obj.metadata.name));

        for (const sub of Object.keys(this.subNodes)) {
            this.subNodes[sub].remove(obj);
        }
    }

    public match(selector: Label[]): E[] {
        if (selector.length === 0) {
            return this.values;
        }

        const relevantLabels = selector.filter(f => f.combined in this.subNodes);

        if (relevantLabels.length === 0) {
            return this.values;
        }

        const subMatches = relevantLabels.map(l => this.subNodes[l.combined].match(selector.slice(1)))

        return subMatches.reduce((prev, cur) => [...prev, ...cur], []);
    }

    public insertWithSelector(selector: {[k: string]: string}|Label[], obj: E) {
        if (!Array.isArray(selector)) {
            selector = orderedLabels(selector);
        }

        if (selector.length === 0) {
            this.values.push(obj);
            return;
        }

        const current = selector.shift()!;
        const currentS = current.key + "=" + current.value;

        if (!(currentS in this.subNodes)) {
            this.subNodes[currentS] = new SearchTreeNode<E>();
        }

        this.subNodes[currentS].insertWithSelector(selector, obj);
    }
}

export class PolicyStore implements Store<EmailPolicy> {
    private policies = new Map<string, EmailPolicy>();
    private defaults: EmailPolicy[] = [];
    private searchTrees: {[ns: string]: SearchTreeNode<EmailPolicy>} = {};

    public match(namespace: string, labels: {[k: string]: string}): EmailPolicy[] {
        if (!(namespace in this.searchTrees)) {
            return this.defaults;
        }

        const ordered = orderedLabels(labels);
        const matches = this.searchTrees[namespace].match(ordered);

        if (matches.length > 0) {
            return matches;
        }

        return this.defaults;
    }

    public store(obj: EmailPolicy): void {
        const {namespace = ""} = obj.metadata;

        this.policies.set(name(obj), obj);

        if (!(namespace in this.searchTrees)) {
            this.searchTrees[namespace] = new SearchTreeNode();
        }

        if (obj.spec.podSelector && obj.spec.podSelector.matchLabels) {
            this.searchTrees[namespace].insertWithSelector(obj.spec.podSelector.matchLabels, obj);
        }

        if (obj.spec.default) {
            this.defaults.push(obj);
        }

        debug("updated policy store: %O", this);
    }

    public get(namespace: string, name: string): EmailPolicy | undefined {
        return this.policies.get(namespace + "/" + name);
    }

    public pull(obj: EmailPolicy): void {
        const {namespace = ""} = obj.metadata;

        this.policies.delete(name(obj));

        if (namespace in this.searchTrees) {
            this.searchTrees[namespace].remove(obj);
        }

        this.defaults = this.defaults.filter(e => !(e.metadata.namespace === obj.metadata.namespace && e.metadata.name === obj.metadata.name));
    }
}