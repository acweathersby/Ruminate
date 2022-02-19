import { Section } from '../types/types';
import { Node } from './base/node';
import { TextSection } from './text';


export class EditLine extends Node {

    prev: EditLine;
    next: EditLine;

    updateLength(): number {

        const length_adjust = 1;

        this.length = super.updateLength() + length_adjust;

        return this.length;
    }

    toElement(host_element?: HTMLElement): Section | null {
        return super.toElement(host_element);
    }

    updateMetrics(offset?: number): number {
        if (!this.prev)
            return super.updateMetrics();
        const new_offset = super.updateMetrics(offset + 1);
        this.head = offset;
        return new_offset;
    }

    updateElement(): void {
        //this.ensureIsEditable();
        return super.updateElement();
    }

    mergeLeft() {
        if (this.prev) {
            //this.prev.removePlaceholder();

            if (this.first_child) {
                if (this.prev.last_child) {
                    this.prev.last_child.next = this.first_child;
                    this.first_child.prev = this.prev.last_child;
                    this.prev.last_child = this.last_child;
                } else {
                    this.prev.first_child = this.first_child;
                    this.prev.last_child = this.last_child;
                }

                for (const child of this.children)
                    child.parent = this.prev;
            }

            this.prev.next = this.next;

            if (this.next)
                this.next.prev = this.prev;

            else
                this.parent.last_child = this.prev;
        }
    }

    ensureIsEditable(): void {
        if (!this.first_child)
            this.addPlaceholder();
    }

    removePlaceholder() {
        if (this.first_child instanceof TextSection
            &&
            this.first_child.IS_PARAGRAPH_PLACEHOLDER)
            this.first_child.remove();
    }

    addPlaceholder() {
        const empty = new TextSection("");
        empty.IS_PARAGRAPH_PLACEHOLDER = true;
        empty.link(null, this);
    }
}
