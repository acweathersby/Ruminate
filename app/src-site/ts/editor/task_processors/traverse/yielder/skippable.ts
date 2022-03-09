import { MDNode } from '../../md_node.js';
import { MetaRoot } from '../meta_root.js';
import { Yielder } from "./yielder.js";

/**
 * Adds a skip method to the node, which, when called, causes the traverser to skip the node's children
 */
export function make_skippable(): SkippableYielder {
    return new SkippableYielder();
}

export class SkippableYielder extends Yielder {

    protected stack_pointer: number;
    protected val_length_stack: number[];

    protected md_offset_stack: number[];

    protected offset_stack: number[];

    protected node_stack: MDNode[];

    protected index: number;

    protected modifyMeta(meta, val_length_stack, node_stack, offset_stack, md_offset_stack) {
        this.node_stack = node_stack;
        this.val_length_stack = val_length_stack;
        this.offset_stack = offset_stack;
        this.md_offset_stack = md_offset_stack;
        this.index = 0;
        meta.skip = this.skip.bind(this);
    }

    /**
    * Adds a skip method to the node, which, when called, causes the traverser to skip over a certain 
    * number of the nodes children.
    * 
    * @param skip_to_child_index The index of child node to skip to. If undefined, all child nodes are skipped.
    */
    skip(skip_to_child_index: number = 0xFFFF) {

        const { stack_pointer: sp, val_length_stack, offset_stack, node_stack, md_offset_stack } = this;
        const current_len = (val_length_stack[sp - 1] >> 16);
        const current_index = ((val_length_stack[sp - 1] & 0x0000FFFF) - 1) - 15;

        if (skip_to_child_index == undefined) skip_to_child_index = ((val_length_stack[sp] & 0xFFFF0000) >> 16) + 1;

        val_length_stack[sp] = (val_length_stack[sp] & 0xFFFF0000) | skip_to_child_index;

        if (current_index !== this.index) {
            //Something has already progressed the iteration beyond
            //this node. Do not try to adjust anything.
        } else {
            if (sp > 0 && current_index < current_len - 1) {
                const node = node_stack[sp];
                offset_stack[sp] = offset_stack[sp - 1] + node.length - node.internal_length - node.post_length;
                md_offset_stack[sp] = md_offset_stack[sp - 1] + node.md_length - node.internal_md_length - node.post_md_length;
            }
        }
    }

    yield(node: MDNode, stack_pointer: number, node_stack: MDNode[], val_length_stack: number[], meta: MetaRoot) {
        this.stack_pointer = stack_pointer;
        this.index = meta.index;
        return this.yieldNext(node, stack_pointer, node_stack, val_length_stack, meta);
    }
}
