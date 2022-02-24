import { MDNode, NodeType, NodeClass as NC, NodeMeta } from "./md_node";

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

/**
 * Make a copy of a node.
 */
export function clone<T extends NodeType>(
    node: MDNode<T>,
    next_gen: number = node.generation
): MDNode<T> {

    //if(node.generation == next_gen)
    //return node

    const new_node = new MDNode(node.type, next_gen + 1);

    new_node.meta = node.meta;

    new_node.children = node.children;

    new_node.length = node.length;

    return new_node;
}

export function newNode<T extends NodeType>(
    type: T,
    children: MDNode[] = [],
    meta: NodeMeta[T] = null
): MDNode<T> {

    const node = new MDNode(type);

    node.meta = meta;

    node.children = children;

    return node;
}

/**
 * Join this node with any adjacent nodes that share
 * compatible features. Repeat process with the node's
 * children. 
 */
export function heal<T extends NodeType>(
    node: MDNode<T>,
    gen: number = node.generation,
    dissolve_types: Set<NodeType> = new Set(),
): MDNode<T> {

    if (node.children.length > 0) {

        const children = node.children.slice();

        let MODIFIED = false;

        for (let i = 0, l = children.length; i < l; i++) {
            const curr_node = children[i];

            if (dissolve_types.has(curr_node.type) && curr_node.is(ITALIC, BOLD)) {
                MODIFIED = true;
                children.splice(i, 1, ...curr_node.children);
                l = children.length;
                i = Math.max(i - 2, -1);
                continue;
            }

            if (i < l - 1) {
                const next_node = children[i + 1];
                if (next_node.type == curr_node.type) {
                    if (curr_node.is(ANCHOR, ITALIC, BOLD, IMAGE, CODE_INLINE)) {
                        MODIFIED = true;
                        const new_node = clone(curr_node);
                        children.splice(i, 2, new_node);
                        new_node.children = new_node.children.concat(next_node.children);
                        new_node.length = curr_node.length + next_node.length;
                        l--;
                        i--;
                        continue;
                    } else if (curr_node.is(TEXT)) {
                        MODIFIED = true;
                        const new_node = clone(curr_node);
                        children.splice(i, 2, new_node);
                        new_node.meta += next_node.meta;
                        new_node.length = curr_node.length + next_node.length;
                        l--;
                        i--;
                        continue;
                    }
                }
            }

            const new_node = heal(curr_node, gen, new Set([...dissolve_types, curr_node.type]));

            if (new_node !== node) {
                MODIFIED = true;
                children[i] = new_node;
            }
        }

        if (MODIFIED == true) {
            const new_node = clone(node);
            new_node.children = children;
            return new_node;
        }
    }

    return node;
}


export function splitNode(
    node: MDNode,
    offset: number,
    prev_gen: number = node.generation
) {
    const { left: [l], right: [r] }
        = split([node], offset, prev_gen);

    return { left: l, right: r };
}
/**
 * Divide this node in two and return the right most node. 
 * 
 * The split point is relative to the length of the node. 
 * 
 * If the split point is 0 or equal to the length of the node
 * then the original node is returned.
 */
export function split(
    nodes: MDNode[],
    offset: number,
    prev_gen: number
): { left: MDNode[], right: MDNode[]; } {
    const left = [], right = [];
    for (const node of nodes) {
        if (offset < node.length && offset > 0) {
            switch (node.type) {
                case UNORDERED_LIST:
                case ANCHOR:
                case BOLD:
                case CODE_INLINE:
                case HEADER:
                case IMAGE:
                case ITALIC:
                case ORDERED_LIST:
                case PARAGRAPH:
                case QUOTE:
                case ROOT:
                    let a = clone(node, prev_gen);
                    let b = clone(node, prev_gen);
                    const { left: cl, right: cr } = split(node.children, offset, prev_gen);
                    a.children = cl;
                    b.children = cr;
                    left.push(a);
                    right.push(b);
                    break;
                case QUERY:
                    left.push(node);
                    break;
                case TEXT: if (node.is(TEXT)) {
                    let a = clone(node);
                    let b = clone(node);
                    a.meta = node.meta.slice(0, offset);
                    b.meta = node.meta.slice(offset);
                    left.push(a);
                    right.push(b);
                } break;
                case CODE_BLOCK:
                    debugger;
                    break;
            }
        } else if (offset < 0) {
            right.push(node);
        } else {
            left.push(node);
        }

        offset -= node.length;
    }

    return { left, right };
}

/**
 * Replace this node with its children and return the first and
 * last child nodes.  
 */
export function dissolve<T extends NodeType>(
    parent: MDNode<T>,
    child: MDNode
): MDNode<T> {
    const index = parent.children.indexOf(child);

    if (index >= 0)

        return replaceMut(clone(parent), index, ...child.children);

    return parent;
}

/**
 * Combine this node with its right most neighbor if 
 * such an operation is allowed. Return the resulting
 * join.
 */
export function mergeRight<T extends NodeType>(
    parent: MDNode<T>,
    left_child: MDNode,
    right_child: MDNode
): MDNode<T> {

    if (
        left_child.type == right_child.type
        &&
        left_child.containsClass(NC.MERGEABLE)
    ) {
        const
            index_left = parent.children.indexOf(left_child),
            index_right = parent.children.indexOf(right_child);

        if (
            index_left >= 0
            &&
            index_right >= 0
            &&
            index_right - index_left == 1
        ) {
            const new_parent = clone(parent);
            let new_left = clone(left_child);

            if (new_left.is(NodeType.TEXT)) {
                new_left.meta += right_child.meta;
            } else if (
                new_left.is(
                    NodeType.BOLD,
                    NodeType.ITALIC,
                    NodeType.CODE_INLINE
                )
            ) new_left.children =
                [...left_child.children, ...right_child.children];

            replaceMut(new_parent, index_left, new_left);
            removeMut(new_parent, index_right);

            return new_parent;
        }
    }

    return parent;
}

/**
 * Remove the node from its parent. Returns a new parent.
 */
export function replace<T extends NodeType>(
    parent: MDNode<T>,
    old_child: MDNode,
    ...new_children: MDNode[]
): MDNode<T> {

    const index = parent.children.indexOf(old_child);

    if (index >= 0) {

        return replaceMut(clone(parent), index, ...new_children);

    } else {
        return parent;
    }
}

function replaceMut<T extends NodeType>(
    parent: MDNode<T>,
    index: number,
    ...new_children: MDNode[]
): MDNode<T> {
    parent.children.splice(index, 1, ...new_children);
    return parent;
}

/**
 * Remove the node from its parent. Returns a new parent.
 */
export function insert<T extends NodeType>(
    parent: MDNode<T>,
    prev: MDNode | null,
    ...children: MDNode[]
): MDNode<T> {
    let index = 0;

    if (prev) {
        index = parent.children.indexOf(prev);
        if (index < 0) {
            index = 0;
        }
    }

    return insertMut(clone(parent), index, ...children);
}

function insertMut<T extends NodeType>(
    parent: MDNode<T>,
    index: number,
    ...children: MDNode[]
): MDNode<T> {
    parent.children.splice(index, 0, ...children);
    return parent;
}

/**
 * Remove the node from its parent. Returns a new parent.
 */
export function remove<T extends NodeType>(
    parent: MDNode<T>,
    child: MDNode
): MDNode<T> {

    const index = parent.children.indexOf(child);

    if (index >= 0)
        return removeMut(clone(parent), index);

    return parent;

}

function removeMut<T extends NodeType>(
    parent: MDNode<T>,
    index: number
): MDNode<T> {
    parent.children.splice(index, 1);
    return parent;
}


/**
 * Replace the given node's children with the child arguments.
 */
export function setChildren<T extends NodeType>(
    parent: MDNode<T>,
    ...children: MDNode[]
): MDNode<T> {
    return setChildrenMut(clone(parent), ...children);
}

function setChildrenMut<T extends NodeType>(
    parent: MDNode<T>,
    ...children: MDNode[]
): MDNode<T> {

    parent.children = children.slice();

    return parent;
}

