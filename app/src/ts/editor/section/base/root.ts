import { Node } from './node';
import { EditLine } from "../line";


export class SectionRoot extends Node {

    first_child: EditLine | null;

    last_child: EditLine | null;

    constructor(sections: EditLine[]) {
        super("div", sections);
    }

    get children(): EditLine[] {
        return <any>super.children;
    }

    toString(): string {
        return this.children.map(c => c.toString()).join("\n\n");
    }
}
