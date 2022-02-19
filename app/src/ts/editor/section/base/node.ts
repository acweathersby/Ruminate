import { Section } from '../../types/types';
import { SectionBase } from './base';


export class Node extends SectionBase {

    ele: HTMLElement;

    /**
     * The tag name of the element this section creates
     */
    private tag: string;
    constructor(
        tag: string,
        sections?: Section[]
    ) {

        super();

        this.tag = tag;

        if (sections) {

            let last = null;

            for (let section of sections)
                last = section.link(last, this);


            this.updateLength();
        }
    }

    isEmpty(): boolean {
        this.toElement();
        return this.ele.innerText.trim() == "";
    }

    updateElement() {
        if (this.ele) {
            this.ele.innerHTML = "";
            for (let node = this.first_child; node; node = node.toElement(this.ele))
                ;
        }
    }


    toElement(host_element?: HTMLElement): Section | null {

        this.ele = this.createElement(this.tag);

        this.updateElement();

        if (host_element)
            host_element.appendChild(this.ele);

        return this.next;
    }

    updateLength() {
        this.length = 0;
        if (this.first_child)
            for (const section of this.first_child.traverse_horizontal())
                this.length += section.length;
        return this.length;
    }
    /**
     * Returns the string representation of the edit graph with
     * Markdown formatting.
     * @returns
     */
    toString(): string {
        if (this.first_child)
            return this.children.join("");
        return "";
    }
}
