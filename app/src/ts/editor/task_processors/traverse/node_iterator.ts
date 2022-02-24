import { MDNode } from '../md_node';
import { Yielder } from './yielder/yielder';


// https://stackoverflow.com/questions/23130292/test-for-array-of-string-type-in-typescript
type ArrayElement<ArrayType extends readonly unknown[], ObjType extends unknown> = ArrayType[number];

export interface TraverserOutput<Meta> {
    //@ts-ignore
    node: MDNode; //| Node[Key];
    meta: Meta;
};

export type CombinedYielded<NextYielder, PrevYielder> = NextYielder & PrevYielder;

export interface ASTIterator<Meta> {

    [Symbol.iterator](): { next(): { done?: boolean, value: TraverserOutput<Meta>; }; };
    /**
     * Iterate through the Iterator
     */
    run: () => void;

    then(arg0: Yielder): ASTIterator<CombinedYielded<Yielder, Meta>>;
};