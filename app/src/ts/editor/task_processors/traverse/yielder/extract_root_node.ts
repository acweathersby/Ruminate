import { MDNode } from '../../md_node.js';
import { Yielder } from "./yielder.js";

export class ExtractYielder extends Yielder {
    protected receiver: { root?: MDNode | null; };

    complete(node: MDNode, stack_pointer: number, node_stack: MDNode[], val_length_stack: number[], meta): MDNode | null {

        this.receiver.root = node;

        return this.completeNext(node, stack_pointer, node_stack, val_length_stack, meta);
    }

}
/**
 * Extracts root node from a traversed AST. If the node has been replaced, then its replacement is
 * extracted.
 *  
 * @param receiver - An object with a property [ast] that will be assigned to the root node.
 */
export function extract(receiver: { root?: MDNode | null; }): ExtractYielder {

    if (!receiver || typeof receiver !== "object")
        throw new TypeError("Expected argument receiver to be of type [Object] when calling function extract.");

    return Object.assign(new ExtractYielder(), { receiver });
}