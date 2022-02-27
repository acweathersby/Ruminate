import { MDNode } from '../md_node';


export function getProperty<K extends keyof MDNode>(node: MDNode, keys: K[]) {
    for (const key of keys) {
        const obj = node[key];
        if (obj) return key;
    }
    return null;
}

export function getChildContainerLength(node: MDNode): number {
    return node.children.length;
};

export function getChildContainer(node: MDNode): MDNode[] {
    return node.children;
};

export function getChildAtIndex(node: MDNode, index: number = 0): MDNode {
    return node.children[index];
};
