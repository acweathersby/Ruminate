import { MDNode } from '../../md_node.js';
import { Yielder } from "./yielder.js";


export class SkipRootYielder extends Yielder {

    yield(node: MDNode, stack_pointer: number, node_stack: MDNode[], val_length_stack: number[], meta) {
        if (stack_pointer <= 0)
            return null;

        return this.yieldNext(node, stack_pointer, node_stack, val_length_stack, meta);
    }

}

/**
 * Skips the yielding of the root node.
 */
export function skip_root(): SkipRootYielder {
    return new SkipRootYielder();
}