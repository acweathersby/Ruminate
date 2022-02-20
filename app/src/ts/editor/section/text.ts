import { Section } from '../types/types';
import { SectionBase } from './base/base';


export class TextSection extends SectionBase {
    text: string;
    parts: Section[];
    ele: Text;
    IS_PARAGRAPH_PLACEHOLDER: boolean;
    constructor(text: string = "") {
        super();
        this.text = text;
        this.length = text.length;
        this.IS_PARAGRAPH_PLACEHOLDER = false;
    }

    get Type() { return TextSection; }

    updateMetrics(offset?: number): number {
        if (this.IS_PARAGRAPH_PLACEHOLDER) {
            this.head = offset;
            this.tail = offset;
        } else {
            this.head = offset;
            this.tail = offset + this.length;
        }
        return this.tail;
    }

    get caret_target() {
        return this.ele;
    }

    merge() {
        if (this.prev instanceof TextSection) {
            this.prev.merge();
        } else {
            let next = this.next;
            while (next instanceof TextSection) {
                this.text += next.text;
                next = next.next;
            }

            if (next) {
                this.next = next;
                next.prev = this;
            } else {
                this.next = null;
                this.parent.last_child = this;
            }

            this.length = this.text.length;
        }
    }

    toElement(host_element?: HTMLElement): Section {

        this.ele = this.createText();

        if (!this.text)
            this.ele.data = '\n';

        else
            this.ele.data = this.text;

        if (host_element)
            host_element.appendChild(this.ele);

        return this.next;
    }

    updateLength() {
        this.length = this.text.length;
        return this.length;
    }

    toString() {
        return this.text;
    }
    /**
     * If the split point is within the text segment then
     * this node is split into two nodes that represent
     * each part of the split text. The right most node is
     * returned in this case.
     */
    split(offset: number): TextSection {
        if (offset < this.length && offset > 0) {
            let left_text = this.text.slice(0, offset);
            let right_text = this.text.slice(offset);
            this.length = left_text.length;
            this.text = left_text;

            const new_node = new TextSection(right_text);
            new_node.parent = this.parent;
            new_node.prev = this;
            new_node.next = this.next;
            new_node.head = this.head + offset;
            new_node.tail = this.tail;
            this.tail = new_node.head;

            if (this.next)
                this.next.prev = new_node;

            else
                this.parent.last_child = new_node;

            this.next = new_node;

            return new_node;
        }
        return this;
    }

    /**
     * Joins adjacent TextSections together
     *
     * Opposite of `split`.
     */
    heal() {

        if (this.prev instanceof TextSection) {
            this.prev.heal();
        } else {
            while (this.next) {
                if (this.next instanceof TextSection) {
                    this.text += this.next.text;
                    this.length = this.text.length;
                    this.tail = this.next.tail;
                    this.next.remove();
                } else
                    break;
            }
        }
    }

    /**
     * Inserts the text string at the given offset and updates
     * the associated Text node.
     */
    insertText(offset: number, text: string) {

        if (this.IS_PARAGRAPH_PLACEHOLDER)
            this.IS_PARAGRAPH_PLACEHOLDER = false;

        if (offset == 0) {
            this.text = text + this.text;
        } else if (offset >= this.length) {
            this.text += text;
        } else {
            this.text = this.text.slice(0, offset) + text + this.text.slice(offset);
        }

        this.tail -= this.length - this.text.length;

        this.length = this.text.length;

        if (this.ele)
            this.ele.data = this.text;
    }

    /**
     * Removes a segment of `length` characters starting at `offset`,
     * where `offset = 0` is the first character in the TextSection.
     */
    removeText(offset: number, length: number) {

        this.text = this.text.slice(0, offset) + this.text.slice(offset + length);

        this.tail -= this.length - this.text.length;

        this.length = this.text.length;

        if (this.ele)
            this.ele.data = this.text;
    }

}
