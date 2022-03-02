import { MDNode } from '../../md_node';

export class Yielder {
    protected nx: Yielder;
    constructor(yielder_function?, complete_function?) {
        this.nx = null;

        if (yielder_function)
            this.yield = yielder_function;
        if (complete_function)
            this.complete = complete_function;
    }
    protected complete(node: MDNode, stack_pointer: number, node_stack: MDNode[], val_length_stack: number[], meta: object): MDNode | null {
        return this.completeNext(node, stack_pointer, node_stack, val_length_stack, meta);
    }

    protected completeNext(node: MDNode, stack_pointer: number, node_stack: MDNode[], val_length_stack: number[], meta: object): MDNode | null {
        if (this.nx)
            return this.nx.complete(node, stack_pointer, node_stack, val_length_stack, meta);
        return node;
    }
    yield(node: MDNode, stack_pointer: number, node_stack: MDNode[], val_length_stack: number[], meta: object): MDNode | null {
        return this.yieldNext(node, stack_pointer, node_stack, val_length_stack, meta);
    }

    protected yieldNext(node: MDNode, stack_pointer: number, node_stack: MDNode[], val_length_stack: number[], meta: object): MDNode | null {
        if (this.nx)
            return this.nx.yield(node, stack_pointer, node_stack, val_length_stack, meta);
        return node;
    }

    protected modifyMeta(meta: any, val_length_stack: number[], node_stack: MDNode[], offset_stack: number[], md_offset_stack: number[]) { }

    protected then(yielder: Yielder): Yielder {

        if (this.nx)
            return this.nx.then(yielder);

        this.nx = yielder;

        return yielder;
    }
}
