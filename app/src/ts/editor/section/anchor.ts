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

    splitCounterpart(): any {
        return new AnchorSection([], this.href);
    }

    get Type() { return AnchorSection; }

    toElement(host_element?: HTMLElement): Section {
        super.toElement(host_element);

        this.ele.href = this.href;

        return this.next;
    }

    heal(): void {
        if (this.next instanceof AnchorSection && this.next.href == this.href) {
            this.next.mergeLeft();
            this.next.remove();
            return this.heal();
        }
        super.heal();
    }

    toString(): string {
        return `[${this.children.map(c => c.toString()).join("")}](${this.href})`;
    }
}
