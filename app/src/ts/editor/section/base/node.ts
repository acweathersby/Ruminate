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


    splitCounterpart(): any {
        return new this.Type([]);
    }



    /**
    * Replaces itself with its children elements
    */
    dissolve() {
        if (this.parent) {
            let prev = this.prev;
            for (const child of this.children) {
                child.link(prev, this.parent);
                prev = child;
            }
            this.remove();
        }
    }

    heal() {
        if (this.first_child)
            for (const ele of this.first_child.traverse_horizontal())
                ele.heal();

    }

    split(local_offset: number) {

        let right = this.splitCounterpart();

        right.link(this);

        const head = this.head;

        right.tail = this.tail;

        this.tail = this.head + local_offset;

        right.head = this.tail;

        for (const child of this.children) {
            if ((child.tail - head) >= local_offset) {
                const child_right = (child.tail - head) == local_offset
                    ? child.next
                    : child.split((head + local_offset) - (child.head));
                if (child_right) {
                    let prev = null;
                    for (const child of child_right.traverse_horizontal()) {
                        child.link(prev, right);
                        prev = child;
                    }
                }
                break;
            }
        }

        return right;
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

    mergeLeft() {
        if (this.prev) {
            let prev = this.prev.last_child;
            for (const child of this.children) {
                child.link(prev, this.prev);
                prev = child;
            }
        }
    }
}
