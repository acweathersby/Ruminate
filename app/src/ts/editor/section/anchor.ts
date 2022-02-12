import { Section } from '../types/types';
import { Node } from './base/node';


export class AnchorSection extends Node {
    /**
     * A URL or reference to another resource
     */
    href: string;

    ele: HTMLAnchorElement;
    constructor(sections: Section[], link: string) {

        super("a", sections);

        this.href = link;
    }

    toElement(host_element?: HTMLElement): Section {
        super.toElement(host_element);

        this.ele.href = this.href;

        return this.next;
    }

    toString(): string {
        return `[${this.children.map(c => c.toString()).join("")}](${this.href})`;
    }
}
