import {
    AnchorEnd,
    AnchorImageStart,
    AnchorMiddle,
    AnchorStart,
    InlineCode, MarkerA,
    MarkerB, QueryEnd,
    QueryStart, Text as MDText
} from "../parser/ast.js";
import { modifySections } from '../task_processors/modify_sections.js';
import { Section } from '../types/types';

/**
 * Sections
 * - Paragraph
 * - Codeblock
 */

///

export type Content = MDText
    | MarkerA
    | MarkerB
    | QueryStart
    | QueryEnd
    | InlineCode
    | AnchorStart
    | AnchorImageStart
    | AnchorMiddle
    | AnchorEnd;

export const enum LineType {
    PARAGRAPH,
    CODEBLOCK,
    QUOTE,
    HEADER,
}

export const enum TextClass {
    bold = 1,
    italic = 2,
    underline = 4,
}

export class SectionBase {

    DIRTY: boolean;

    /**
     * The total number of Markdown characters represented by this section.
     */
    length: number;
    ele?: HTMLElement | Text;
    parent: Section | null;
    prev: Section | null;
    next: Section | null;
    first_child: Section | null;
    last_child: Section | null;

    head: number;

    tail: number;

    constructor() {
        this.length = 0;
        this.ele = null;
        this.DIRTY = false;
        this.parent = null;
        this.prev = null;
        this.next = null;
        this.first_child = null;
        this.last_child = null;
        this.head = 0;
        this.tail = 0;
    }

    get Type(): any { return SectionBase; }

    toElement(host_element?: HTMLElement): Section {

        this.ele = document.createElement("div");
        this.ele.innerText = "[SECTION BASE]";

        if (host_element)
            host_element.appendChild(this.ele);

        return this.next;
    }

    createElement(tag: string): HTMLElement {
        const ele = document.createElement(tag);
        //@ts-ignore
        ele.ruminate_host = this;
        this.ele = ele;
        return ele;
    }


    updateMetrics(offset = 0) {

        this.head = offset;

        if (this.first_child) {
            for (const child of this.first_child.traverse_horizontal()) {
                offset = child.updateMetrics(offset);
            }
        }

        this.tail = offset;

        return offset;
    }
    /**
     * Split the section in two, return a new section that is immediately
     * right adjacent to this section
     * @returns 
     */
    split(offset: number): Section {
        const obj = new this.constructor.prototype();
        obj.link(this);
        return obj;
    }


    createText(): Text {
        if (this.ele) return <Text>this.ele;
        const ele = new Text;
        //@ts-ignore
        ele.ruminate_host = this;
        this.ele = ele;
        return ele;
    }
    /**
     * Remove the section from its list if it belongs to
     * one.
     */
    remove() {

        if (this.prev)
            this.prev.next = this.next;

        if (this.next)
            this.next.prev = this.prev;

        if (this.parent) {
            if (this.parent.first_child == this)
                this.parent.first_child = this.next;
            if (this.parent.last_child == this)
                this.parent.last_child = this.prev;
        }

        this.next = null;
        this.prev = null;
    }
    /**
     * Link this node into a parent section chain
     * 
     * 
     * @param {Section|null} prev - An existing node in the target parents chain that
     *  this node should follow. If this is `null` then this node will
     *  be inserted at the head of the chain.
     * 
     * @param {Section} target_parent - A Section that can accept sub-sections.
     * 
     */
    link(prev: Section | null, target_parent: Section = null) {
        if (!target_parent) {
            if (prev)
                target_parent = prev.parent;
            else
                throw new Error("Missing parent section to link");
        }

        if (this.parent) {
            if (!this.prev)
                this.parent.first_child = this.next;
            if (!this.next)
                this.parent.last_child = this.prev;
        }

        if (this.prev) {
            if (prev == this.prev) return;
            this.prev.next = this.next;
        }

        if (this.next)
            this.next.prev = this.prev;

        this.prev = null;
        this.next = null;

        this.parent = target_parent;

        if (!prev) {
            const next = target_parent.first_child;

            if (next) {
                next.prev = this;
            } else {
                target_parent.last_child = this;
            }

            this.next = next;

            target_parent.first_child = this;

        } else {

            this.prev = prev;

            this.next = prev.next;

            if (prev.next) {
                prev.next.prev = this;
            } else {
                this.parent.last_child = this;
            }

            prev.next = this;
        }

        return this;
    }

    get index(): number {
        if (this.prev) {
            return this.prev.index + 1;
        } else {
            return 0;
        }
    }

    get leading_offset() {
        return 0;
    }

    get children() {
        if (!this.first_child)
            return [];
        return [...this.first_child.#traverse_horizontal()];
    }

    *#traverse_horizontal(): Generator<Section> {
        let next = this.next;
        yield this;
        let node = next;
        while (node && node != this) {
            next = node.next;
            yield node;
            node = next;
        }
    }

    /**
     * Returns a generator that yields this node and its siblings. Preserves
     * current ordering and linkage even if modified during iteration.
     * 
     */
    *traverse_horizontal(LOOP: boolean = false): Generator<Section> {
        let next = this.next;
        let parent = this.parent;
        if (parent) {

            const curr_idx = this.index;
            const children = parent.children;
            const length = children.length;

            yield this;

            for (
                let i = (curr_idx + 1) % length;
                i != curr_idx;
                i = (i + 1) % length
            ) {
                if (i == 0 && !LOOP)
                    // Either `this` is at index 0 and it has already been yield,
                    // we have just looped to the start of the array as a result
                    // of the modulus operation.
                    break;

                yield children[i];
            }

        } return this.#traverse_horizontal();

    }

    hasSingleChild(): boolean {
        return this.last_child !== null && this.last_child == this.first_child;
    }

    numberOfChildren(): number {
        if (this.first_child)
            return this.children.length;
        return 0;
    }

    updateLength(): number {
        return this.length;
    }

    get markdown_length() {
        return this.length;
    }

    /**
     * Returns `true` if the givin offset is within the bounds of
     * node. If the node is zero length, then returns `true` if
     * the offset is equal to the node's offset.
     */
    overlaps(offset: number) {
        return this.head <= offset && this.tail >= offset;
    }
}

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
                } else break;
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
            for (let node = this.first_child; node; node = node.toElement(this.ele));
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


export class EditLine extends Node {
    /**
     * Indicates the HTML element type
     * that wraps the section contents. 
     */
    line_type: LineType;

    /**
     * An indicator of how the element type should be adjusted. 
     */

    meta_value: number;

    prev: EditLine;
    next: EditLine;

    constructor(sections: Section[], type: LineType, meta_value: number = 0) {
        super({
            [LineType.PARAGRAPH]: "p",
            [LineType.CODEBLOCK]: "pre",
            [LineType.HEADER]: "h" + meta_value,
            [LineType.QUOTE]: "quote",
        }[type], sections);

        this.line_type = type;
    }

    updateLength(): number {
        const length_adjust = 1;
        this.length = super.updateLength() + length_adjust;
        return this.length;
    }


    toElement(host_element?: HTMLElement): Section | null {
        if (this.line_type == LineType.CODEBLOCK) {
            return this.next;
        } else {
            return super.toElement(host_element);
        }
    }

    updateMetrics(offset?: number): number {
        if (!this.prev)
            return super.updateMetrics();
        const new_offset = super.updateMetrics(offset + 1);
        this.head = offset;
        return new_offset;
    }

    updateElement(): void {
        this.ensureIsEditable();
        return super.updateElement();
    }

    mergeLeft() {
        if (this.prev) {
            this.prev.removePlaceholder();

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
        if (
            this.first_child instanceof TextSection
            &&
            this.first_child.IS_PARAGRAPH_PLACEHOLDER
        )
            this.first_child.remove();
    }

    addPlaceholder() {
        const empty = new TextSection("");
        empty.IS_PARAGRAPH_PLACEHOLDER = true;
        empty.link(null, this);
    }

}

export class FormatNode extends Node {

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

    split(offset: number) {

        let right = new this.Type([]);

        right.link(this);

        const head = this.head;

        right.tail = this.tail;

        this.tail = this.head + offset;

        right.head = this.tail;

        for (const child of this.children) {
            if ((child.tail - head) >= offset) {
                const child_right = (child.tail - head) == offset
                    ? child.next
                    : child.split((head + offset) - (child.head));
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

    /**
     * Joins adjacent ItalicSection together
     * and removes redundancies within the italic 
     * section. 
     * 
     * Opposite of `split`.
     */
    heal() {

        const Type: typeof FormatNode = this.Type;

        if (this.prev instanceof FormatNode && this.prev instanceof Type) {
            this.prev.heal();
        } else {
            while (this.next) {
                if (this.next instanceof Type) {
                    let prev = this.last_child;
                    for (const child of this.next.children) {
                        child.link(prev, this);
                        prev = child;
                    }
                    this.tail = this.next.tail;
                    this.next.remove();
                } else break;
            }
            //Remove Italic sections within the section
            modifySections(this, this.head, this.tail, {
                on_section_segment(s, start, end, mf) {
                    modifySections(s, start, end, mf);
                    if (s instanceof Type)
                        s.dissolve();
                    else if (s instanceof FormatNode)
                        s.heal();

                },
                on_seg_overlap(s, start, end, mf) {
                    modifySections(s, start, end, mf);
                    if (s instanceof Type)
                        s.dissolve();
                    else if (s instanceof FormatNode || s instanceof TextSection)
                        s.heal();
                },
                on_text_segment(s) {
                    s.heal();
                }
            });
        }
    }
}
export class ItalicSection extends FormatNode {

    constructor(
        sections: Section[]
    ) {
        super("i", sections);
    }

    get Type() { return ItalicSection; }

    get leading_offset() {
        return 1;
    }

    get markdown_length() {
        return this.length + 2;
    }

    toString(): string {
        return `*${super.toString()}*`;
    }
}

export class BoldSection extends FormatNode {

    constructor(
        sections: Section[]
    ) {
        super("strong", sections);
    }

    get leading_offset() {
        return 2;
    }

    get markdown_length() {
        return this.length + 4;
    }

    toString(): string {
        return `__${super.toString()}__`;
    }
}


