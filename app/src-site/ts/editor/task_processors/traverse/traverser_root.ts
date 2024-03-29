import { MDNode, NodeClass, NodeType } from '../md_node';
import { MetaRoot } from './meta_root';
import { ASTIterator, CombinedYielded, TraverserOutput } from './node_iterator';
import { type_filter, typeFilterYielder } from './yielder/type_filter';
import { make_replaceable, replace, ReplaceableYielder, ReplaceFunction, ReplaceTreeFunction } from './yielder/replaceable';
import { Yielder } from './yielder/yielder';
import { classFilterYielder, class_filter } from './yielder/class_filter';
import { skip_root } from './yielder/skip_root';
import { make_skippable, SkippableYielder } from './yielder/skippable';
import { inRangeYielder, range_filter } from './yielder/in_range';
import { extract } from './yielder/extract_root_node';


const index_zeropoint = 15;
export class Traverser<B> implements ASTIterator<B> {
    protected node: MDNode;
    protected sp: number;
    protected BEGINNING: boolean;
    protected yielder: Yielder;
    protected readonly meta: B & MetaRoot;
    protected readonly max_depth: number;
    /**
     * Stores index and length of a node's child array.
     * 
     * Index is stored in the liw 16 bits and array length
     * in the high 16 bits.
     */
    protected readonly length_index_stack: number[];
    protected readonly node_stack: MDNode[];
    protected readonly offset_stack: number[];

    protected readonly md_offset_stack: number[];
    protected offset: number;
    protected ancestry: () => MDNode[];

    protected reset: (arg?: MDNode) => void;

    constructor(root: MDNode, meta: B & MetaRoot, max_depth: number) {
        this.node = root;
        this.sp = 0;
        this.BEGINNING = false;
        this.yielder = null;
        this.max_depth = max_depth;
        this.length_index_stack = [];
        this.offset_stack = [];
        this.md_offset_stack = [];
        this.node_stack = [];
        this.offset = 0;
        this.meta = meta;
        this.ancestry = this.getAncestry.bind(this);
        this.reset = this.resetTraversal.bind(this);
    }

    getAncestry(): MDNode[] {
        return this.node_stack.slice(0, this.sp).reverse();
    }

    resetTraversal(root_node: MDNode = this.node) {
        this.meta.index = 0;
        this.meta.depth = 0;
        this.sp = 0;
        this.BEGINNING = true;
        this.offset_stack.length = 0;
        this.length_index_stack.length = 0;
        this.node_stack.length = 0;
        this.node = root_node;
    }

    [Symbol.iterator]() {
        this.resetTraversal();
        return this;
    }
    next(): {
        done?: boolean;
        value: TraverserOutput<B>;
    } {
        const {
            BEGINNING,
            node,
            max_depth,
            node_stack,
            offset_stack,
            md_offset_stack,
            length_index_stack: val_length_stack,
            meta
        } = this;

        // Prevent infinite loop from a cyclical graph;
        if (this.sp > 100000)
            throw new (class CyclicalError extends Error {
            })("Max node tree depth reached. The tree may actually be a cyclical graph.");

        if (BEGINNING) {

            this.BEGINNING = false;

            if (!this.yielder) this.yielder = new Yielder();

            if (node) {
                //@ts-ignore
                node_stack[0] = this.node;
                val_length_stack[0] = (this.node.children.length << 16) + index_zeropoint;
                val_length_stack[1] = 0 + index_zeropoint;
                offset_stack[0] = 0;
                offset_stack[1] = node.pre_length;
                md_offset_stack[0] = 0;
                md_offset_stack[1] = node.pre_md_length;

                this.sp = 0;

                meta.parent = null;
                meta.head = 0;
                meta.md_head = 0;
                meta.tail = node.length;
                meta.md_tail = node.md_length;

                const y = this.yielder.yield(node, this.sp, node_stack, val_length_stack, meta);

                if (y) return { value: { node: y, meta, getAncestry: this.ancestry, reset: this.reset }, done: false };
            } else
                return { value: null, done: true };
        }

        while (this.sp >= 0) {

            const
                len = this.length_index_stack[this.sp],
                limit = (len & 0xFFFF0000) >> 16,
                index = (len & 0x0000FFFF) - index_zeropoint;

            if (this.sp < max_depth && index < limit) {

                offset_stack[this.sp] = offset_stack[this.sp + 1]
                    || offset_stack[this.sp];

                md_offset_stack[this.sp] = md_offset_stack[this.sp + 1]
                    || md_offset_stack[this.sp];

                meta.head = offset_stack[this.sp];
                meta.md_head = md_offset_stack[this.sp];
                meta.parent = node_stack[this.sp];

                const child = node_stack[this.sp].children[index];

                val_length_stack[this.sp]++;

                this.sp++;

                node_stack[this.sp] = child;

                // Increment the offset by the amount of characters proceeding
                // this node's children
                offset_stack[this.sp] = meta.head + child.pre_length;
                md_offset_stack[this.sp] = meta.md_head + child.pre_md_length;

                val_length_stack[this.sp] = (child.children.length << 16) + index_zeropoint;

                if (child) {
                    meta.prev = node_stack[this.sp - 1].children[index - 1];
                    meta.next = node_stack[this.sp - 1].children[index + 1];
                    meta.index = index;
                    meta.depth = this.sp;
                    meta.tail = meta.head + child.length;
                    meta.md_tail = meta.md_head + child.md_length;

                    //@ts-ignore
                    const y = this.yielder.yield(child, this.sp, node_stack, val_length_stack, meta);

                    if (y)
                        return { value: { node: y, meta, getAncestry: this.ancestry, reset: this.reset }, done: false };
                }
            } else {
                const old_sp = this.sp;
                const node = node_stack[old_sp];
                this.sp--;

                offset_stack[this.sp] = offset_stack[old_sp]
                    + (node ? (node.post_length + node.internal_length) : 0);

                offset_stack[old_sp] = 0;

                md_offset_stack[this.sp] = md_offset_stack[old_sp]
                    + (node ? (node.post_md_length + node.internal_md_length) : 0);

                md_offset_stack[old_sp] = 0;


            }
        }

        //@ts-ignore
        this.yielder.complete(node_stack[0], this.sp, node_stack, val_length_stack, meta);

        return { value: null, done: true };
    }
    then<U>(next_yielder: U): Traverser<CombinedYielded<U, B>> {

        //@ts-ignore
        next_yielder.modifyMeta(this.meta, this.length_index_stack, this.node_stack, this.offset_stack, this.md_offset_stack);

        if (typeof next_yielder == "function")
            next_yielder = next_yielder();

        if (!this.yielder)
            //@ts-ignore
            this.yielder = next_yielder;
        else
            //@ts-ignore
            this.yielder.then(next_yielder, this.key);

        //@ts-ignore
        next_yielder.key = this.key;

        return <Traverser<CombinedYielded<U, B>>><unknown>this;
    }
    /**
     * Run the traverser to completion as it is currently configured.
     * 
     * If a function is passed as the `fn` argument, an array of 
     * values returned by the `fn` function will be returned at the end of 
     * the run. Nullable values will be discarded.
     * 
     * @param fn - A function that is passed `node` and `meta` arguments and 
     * that may optional return a value.
     */
    run<A>(fn?: ((node: MDNode, meta: B) => A) | boolean, RETURN_ROOT: boolean = false): A[] | MDNode[] | MDNode {

        if (typeof fn == "boolean" && fn && !RETURN_ROOT) {

            const output: MDNode[] = [];

            for (const { node, meta } of this) output.push(node);

            return output;

        } else if (typeof fn == "function") {

            const output: A[] = [];

            for (const { node, meta } of this) {

                const val: A = fn(node, meta);

                if (typeof val == "undefined" || val === null)
                    continue;

                if (!RETURN_ROOT) output.push(val);
            }
            return RETURN_ROOT ? this.node_stack[0] : output;
        } else {
            for (const { } of this);
            return this.node_stack[0];
        }
    }


    map<A>(fn: ((node: MDNode, meta: B) => A)): A[] | MDNode[] {

        const output: A[] = [];

        for (const { node, meta } of this) {

            const val: A = fn(node, meta);

            if (typeof val == "undefined" || val === null)
                continue;
        }

        return output;
    }

    rangeFilter(range_start: number, range_end: number): Traverser<CombinedYielded<inRangeYielder, B>> {
        return this.then(range_filter(range_start, range_end));
    }

    makeReplaceable(replace_function?: ReplaceTreeFunction): Traverser<CombinedYielded<ReplaceableYielder, B>> {
        return this.then(make_replaceable(replace_function));
    }
    replace(replace_function: ReplaceFunction<B>, replace_tree_function?: ReplaceTreeFunction): Traverser<B> {
        return this.then(replace<B>(replace_function, replace_tree_function));
    }

    classFilter(...classes: NodeClass[]): Traverser<CombinedYielded<classFilterYielder, B>> {
        return this.then(class_filter(...classes));
    }

    typeFilter(...types: NodeType[]): Traverser<CombinedYielded<typeFilterYielder, B>> {
        return this.then(type_filter(...types));
    }

    makeSkippable(): Traverser<CombinedYielded<SkippableYielder, B>> {
        return this.then(make_skippable());
    }

    extract(receiver: { root: any; }): Traverser<B> {
        return this.then(extract(receiver));
    }

    skipRoot(): Traverser<B> {
        return this.then(skip_root());
    }
};