import { MDNode, NodeType } from "../section/base/md_node";

const {
    ANCHOR,
    BOLD,
    CODE_BLOCK,
    CODE_INLINE,
    HEADER,
    IMAGE,
    ITALIC,
    ORDERED_LIST,
    PARAGRAPH,
    QUERY,
    QUOTE,
    ROOT,
    TEXT,
    UNORDERED_LIST,
} = NodeType;

function toHTML(node: MDNode): HTMLElement {
    console.warn("TO HTML NOT IMPLEMENTED");
    return document.createElement("div");
}

export function toMDString(node: MDNode): string {
    if (node.is(PARAGRAPH)) {
        return nodeChildrenToString(node);
    } else if (node.is(TEXT)) {
        return node.meta;
    } else if (node.is(ANCHOR)) {
        return ["[", node.meta, "]", "(", nodeChildrenToString(node), ")"].join("");
    } else if (node.is(BOLD)) {
        return ["__", nodeChildrenToString(node), "__"].join("");
    } else if (node.is(CODE_BLOCK)) {
        const { syntax, state, text } = node.meta;
        if (state)
            return ["```", syntax, "\n", state.doc.toString(), "\n```"].join("");
        return ["```", syntax, "\n", text, "\n```"].join("");
    } else if (node.is(CODE_INLINE)) {
        return ["`", nodeChildrenToString(node), "`"].join("");
    } else if (node.is(HEADER)) {
        return [("#").repeat(node.meta), " ", nodeChildrenToString(node)].join("");
    } else if (node.is(IMAGE)) {
        return ["![", node.meta, "]", "(", nodeChildrenToString(node), ")"].join("");
    } else if (node.is(ITALIC)) {
        return ["*", nodeChildrenToString(node), "*"].join("");
    } else if (node.is(ORDERED_LIST)) {
        return [("  ").repeat(node.meta), "1. ", nodeChildrenToString(node)].join("");
    } else if (node.is(QUERY)) {
        return ["[", node.meta, "]", "(", nodeChildrenToString(node), ")"].join("");
    } else if (node.is(QUOTE)) {
        return ["> ", nodeChildrenToString(node)].join("");
    } else if (node.is(ROOT)) {
        return nodeChildrenToString(node, "\n\n");
    } else if (node.is(UNORDERED_LIST)) {
        return [("  ").repeat(node.meta), "- ", nodeChildrenToString(node)].join("");
    } else return "";
}

function nodeChildrenToString(
    node: MDNode,
    separator: string = ""
): string {
    return node.children.map(toMDString).join(separator);
}
