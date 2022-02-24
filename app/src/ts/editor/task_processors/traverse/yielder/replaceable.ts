import { MDNode } from '../../md_node.js';
import { clone } from '../../operators.js';
import { incrementOffset } from '../increment_offset.js';
import { MetaRoot } from '../meta_root.js';
import { initLength } from '../traverse.js';
import { Yielder } from "./yielder.js";

/**
 * Called when a child of a node is replaced. Allows the 
 * the node to be duplicated / transformed to keep the 
 * AST unique. 
 * 
 * #### Example:
 * 
 * ```javascript
 *  (node: MDNode, child: MDNode, child_index: number, children: MDNode[]) => Object.assign({}, node);
 * ```
 * 
 * 
 */
export type ReplaceTreeFunction = (
    node: MDNode,
    replacement: MDNode | MDNode[],
    child_index: number,
    children: MDNode[],
    alertNewParent: () => void,
    next_gen: number
) => MDNode;

/**
 * A function that is used in the replace yielder. Receives
 * the node that may be replace and the meta object.
 */
export type ReplaceFunction<B> = (node: MDNode, meta?: MetaRoot & B) => MDNode;
export class ReplaceableYielder extends Yielder {

    protected node: MDNode;
    protected stack_pointer: number;
    protected node_stack: MDNode[];
    protected val_length_stack: number[];
    /**
     * The replace function;
     */
    protected replace_tree_function?: ReplaceTreeFunction;

    protected next_gen: number;

    protected offset_stack: number[];

    protected curr_offset: number;

    protected modifyMeta(meta, val_length_stack, node_stack, offset_stack) {
        meta.replace = this.replace.bind(this);
        this.node_stack = node_stack;
        this.offset_stack = offset_stack;
        this.val_length_stack = val_length_stack;
        this.next_gen = meta.next_gen;
        this.curr_offset = 0;
    }

    yield(node: MDNode, stack_pointer: number, node_stack: MDNode[], val_length_stack: number[], meta): MDNode | null {

        this.node = node;

        this.stack_pointer = stack_pointer;

        this.curr_offset = meta.head;

        return this.yieldNext(node, stack_pointer, node_stack, val_length_stack, meta);
    }

    replace(
        replacement: MDNode | MDNode[],
        PROCESS_NEW_NODE: boolean = false,
        ROOT = true
    ) {

        const
            node_stack: MDNode[] = this.node_stack,
            val_length_stack: number[] = this.val_length_stack;

        let sp = this.stack_pointer;

        //need to trace up the current stack and replace each node with a duplicate
        if (sp > 0) {
            if (ROOT) {
                if (replacement) {
                    if (Array.isArray(replacement))
                        replacement.map(initLength);
                    else
                        initLength(replacement);
                }
            }

            this.replaceNodes(node_stack, sp, val_length_stack, replacement, PROCESS_NEW_NODE);

            if (ROOT) {

                if (replacement) {
                    if (Array.isArray(replacement)) {
                        if (PROCESS_NEW_NODE) {
                            this.offset_stack[sp] = incrementOffset(replacement[0], this.curr_offset);
                        } else {
                            this.offset_stack[sp] = this.curr_offset + replacement.reduce((r, n) => r + n.length, 0);
                        }
                    } else {
                        if (PROCESS_NEW_NODE) {
                            this.offset_stack[sp] = this.curr_offset;
                        } else {
                            this.offset_stack[sp] = incrementOffset(replacement, this.curr_offset);
                        }
                    }
                } else {
                    this.offset_stack[sp] = this.curr_offset;
                }
            }
        } else {
            node_stack[0] = Array.isArray(replacement) ? replacement[0] : replacement;
        }
    }

    protected replaceNodes(
        node_stack: MDNode[],
        sp: number,
        val_length_stack: number[],
        replacement: MDNode | MDNode[],
        PROCESS_NEW_NODE: boolean = false
    ) {
        try {

            let
                parent = node_stack[sp - 1];

            const
                REPLACEMENT_IS_ARRAY = Array.isArray(replacement),
                REPLACEMENT_IS_NULL = null === replacement,
                len = val_length_stack[sp - 1],
                index = (len & 0xFFFF) - 1,
                new_child_children_length = REPLACEMENT_IS_NULL
                    ? 0
                    : (REPLACEMENT_IS_ARRAY ? replacement[0] : replacement).children.length,
                children: MDNode[] = parent.children.slice();

            let REPLACE_PARENT = false;

            parent = this.replace_tree_function(
                parent,
                replacement,
                index,
                children,
                () => REPLACE_PARENT = true,
                this.next_gen
            );

            if (parent && !REPLACE_PARENT) {

                //If the parent is replaced then the stack pointer should be
                //reset to the parent's children nodes

                if (new_child_children_length != (val_length_stack[sp] >> 16))
                    val_length_stack[sp] = (new_child_children_length << 16) | (val_length_stack[sp] & 0xFFFF);

                if (REPLACEMENT_IS_NULL) {

                    val_length_stack[sp - 1] -= (1 << 16);

                    children.splice(index, 1);

                    node_stack[sp] = children[index - 1];
                } else if (REPLACEMENT_IS_ARRAY) {
                    //Increment the length of the stack and set the index to the end of the array
                    //@ts-ignore 
                    val_length_stack[sp - 1] += ((replacement.length - 1) << 16 | (replacement.length - 1));
                    //@ts-ignore
                    children.splice(index, 1, ...replacement);
                    node_stack[sp] = replacement[0];
                } else {
                    //@ts-ignore 
                    children[index] = replacement;
                    //@ts-ignore 
                    node_stack[sp] = replacement;
                }


                parent.children = children;

                if (REPLACEMENT_IS_NULL) {
                    val_length_stack[sp - 1] -= 1;
                } else if (PROCESS_NEW_NODE) {
                    if (REPLACEMENT_IS_ARRAY) {
                        val_length_stack[sp - 1] -= replacement.length;
                    } else {
                        val_length_stack[sp - 1] -= 1;
                    }
                }
            }

            this.stack_pointer--;

            this.replace(parent, REPLACE_PARENT && parent, false);

        } catch (e) {
            console.log(0, 1, this.stack_pointer, node_stack);
            console.log(e);
            throw e;
        }
    }
}
export class ReplaceYielder<B> extends ReplaceableYielder {
    /**
     * Called on every node that may be mutated. If a new node or null is 
     * returned, then then node is permanently replaced/removed
     */
    protected replace_function?: ReplaceFunction<B>;
    protected modifyMeta(meta, val_length_stack, node_stack) {
        this.node_stack = node_stack;
        this.val_length_stack = val_length_stack;
    }
    yield(node: MDNode, stack_pointer: number, node_stack: MDNode[], val_length_stack: number[], meta): MDNode | null {

        const new_node = this.replace_function(node);

        this.stack_pointer = stack_pointer;

        if (new_node == null || new_node && new_node !== node) {

            this.replace(new_node, false);

            if (new_node == null) return null;
        }

        this.stack_pointer = stack_pointer;

        return this.yieldNext(node, stack_pointer, node_stack, val_length_stack, meta);
    }
}

function default_replace_tree_function(
    node: MDNode,
    child: MDNode,
    child_index: number,
    children: MDNode[],
    alertNewParent: () => void,
    generation
): MDNode {
    if (node.generation < generation)
        return clone(node, generation - 1);
    return node;
}


/**
 * Add a replace method to the node, allowing the node to be replaced with another node.
 * 
 * @param {ReplaceTreeFunction} replace_function - A function used to handle the replacement
 * of ancestor nodes when a child node is replaced. Defaults to performing a shallow copy for 
 * each ancestor of the replaced node.
 */
export function make_replaceable(replace_tree_function?: ReplaceTreeFunction): ReplaceableYielder {
    return Object.assign(<ReplaceableYielder>new ReplaceableYielder(),
        { replace_tree_function: replace_tree_function ? replace_tree_function : default_replace_tree_function }
    );
}
/**
 * Allows a non-destructive replacement of nodes through a replace function 
 * @param {ReplaceFunction} replace_tree_function - Function that may return a new node. If a new node or null is returned,
 * then the tree will be mutated with the new node, or the node will be removed if null is returned
 * 
 * @param {ReplaceTreeFunction} replace_tree_function - A function used to handle the replacement
 * of ancestor nodes when a child node is replaced. Defaults to performing a shallow copy for 
 * each ancestor of the replaced node.
 */
export function replace<B>(
    replace_function: ReplaceFunction<B>,
    replace_tree_function?: ReplaceTreeFunction
): ReplaceYielder<B> {
    return Object.assign(<ReplaceYielder<B>>new ReplaceYielder<B>(),
        {
            replace_function: replace_function,
            replace_tree_function: replace_tree_function ? replace_tree_function : default_replace_tree_function
        }
    );
}

