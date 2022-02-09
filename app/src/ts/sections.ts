import {
    AnchorEnd,
    AnchorImageStart,
    AnchorMiddle,
    AnchorStart,
    ASTType, InlineCode, Markdown,
    MarkerA,
    MarkerB, QueryEnd,
    QueryStart, Text as MDText
} from "./ast.js";
import { Section } from './types/types';

/**
 * Sections
 * - Paragraph
 * - Codeblock
 */

///

type Content = MDText
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


    createText(): Text {
        if (this.ele) return <Text>this.ele;
        const ele = new Text;
        //@ts-ignore
        ele.ruminate_host = this;
        this.ele = ele;
        return ele;
    }

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
    type: LineType;

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

        this.type = type;
    }

    updateLength(): number {
        const length_adjust = 1;
        this.length = super.updateLength() + length_adjust;
        return this.length;
    }


    toElement(host_element?: HTMLElement): Section | null {
        if (this.type == LineType.CODEBLOCK) {
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


export class ItalicSection extends Node {

    linked: ItalicSection | null;

    constructor(
        sections: Section[]
    ) {
        super("i", sections);
    }

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

export class BoldSection extends Node {

    linked: BoldSection | null;

    constructor(
        sections: Section[]
    ) {
        super("strong", sections);
    }

    linkEnd(end: BoldSection) {
        if (end.linked)
            throw new Error(`${this.constructor.name} already linked`);
        end.linked = this;
        this.linked = end;
    }

    get leading_offset() {
        return 1;
    }

    get markdown_length() {
        return this.length + 2;
    }

    toString(): string {
        return `_${super.toString()}_`;
    }
}

export function convertMDASTToEditLines(md: Markdown): EditLine[] {
    const lines: EditLine[] = [];
    for (const line of md.lines) {
        if (line.node_type == ASTType.Line)
            switch (line.header.node_type) {
                case ASTType.Header:
                    break;
                case ASTType.Ol:
                case ASTType.Ul:
                    break;
                case ASTType.Paragraph:
                    //If the line data is empty then ignore it. 
                    /* if (line.content.length == 0)
                        continue; */

                    const paragraph = new EditLine(convertContent(line.content), LineType.PARAGRAPH, 0);
                    paragraph.type = LineType.PARAGRAPH;
                    lines.push(paragraph);

                    break;
            }
        else {

        }
    }

    return lines;
}

export function convertContent(raw_content: Content[]) {
    return convertOuterContent(codeContent(raw_content));
}

export function getTextRepresentation(obj: Content) {
    switch (obj.node_type) {
        case ASTType.AnchorStart:
            return "[";
        case ASTType.AnchorImageStart:
            return "![";
        case ASTType.AnchorMiddle:
            return "](";
        case ASTType.AnchorEnd:
            return "]";
        case ASTType.QueryStart:
            return "{";
        case ASTType.QueryEnd:
            return "}";
        case ASTType.MarkerA:
            return "*";
        case ASTType.MarkerB:
            return "_";
        case ASTType.Text:
            if (obj instanceof MDText)
                return obj.value;
            return "";
    }
}

export function convertOuterContent(raw_content: Content[], offset = 0, length = raw_content.length) {

    const line_contents: Section[] = [];

    for (let i = offset; i < length; i++) {

        const obj = raw_content[i];

        switch (obj.node_type) {
            case ASTType.MarkerA:
            case ASTType.MarkerB:
                {
                    var d = tryFormat(obj.node_type, raw_content, line_contents, i, length);
                    if (d != i) { i = d; continue; };
                }
                break;
            case ASTType.AnchorStart:
            case ASTType.AnchorImageStart:
                { // Look ahead for the middle and end tokens
                    let mid = -1;
                    let end = -1;
                    for (let j = i + 1; j < length; j++) {
                        let obj2 = raw_content[j];
                        if (obj2 instanceof AnchorMiddle)
                            mid = j;
                        if (obj2 instanceof AnchorEnd)
                            end = j;
                    }

                    if (mid < end && end > i) {
                        debugger;
                    } else {
                        line_contents.push(new TextSection(getTextRepresentation(obj)));
                    }
                }
                break;
            case ASTType.QueryStart:
                //Temporary
                line_contents.push(new TextSection(getTextRepresentation(obj)));
                break;
            case ASTType.AnchorMiddle:
            case ASTType.AnchorEnd:
            case ASTType.QueryEnd:
            case ASTType.Text:
                line_contents.push(new TextSection(getTextRepresentation(obj)));
                break;
            case ASTType.InlineCode:
                //Temporary
                line_contents.push(new TextSection(getTextRepresentation(obj)));
                break;
        }

    }

    return line_contents;
}

function tryFormat(
    type: ASTType,
    raw_content: Content[],
    line_content: Section[],
    offset: number,
    length: number
) {

    let start = offset + 1;
    let search_size = 1;

    for (let i = start; i < length; i++)
        if (raw_content[i].node_type !== type) { start = i; break; };

    search_size = start - offset;

    if (search_size > 2 || search_size == 1)
        search_size = 1;
    else
        search_size = 2;

    let start_node = raw_content[start];

    if (start_node instanceof MDText && start_node.value[0] == " ")
        return offset;

    let matches = [];

    for (let i = start; i < length; i++) {

        const node = raw_content[i - 1];

        if (raw_content[i].node_type == type && !(node instanceof MDText && node.value[node.value.length - 1] == " ")) {

            let j = i + 1;

            while (j < length && raw_content[j].node_type == type) { j++; };

            let diff = j - i;

            if (diff >= search_size) {

                matches.push(j);

                if (diff == search_size) { break; }
            }

            i += diff;
        }
    }

    if (matches.length > 0) {
        const end = matches.pop();

        var start_section;

        const sections = convertOuterContent(
            raw_content,
            offset + search_size,
            end - search_size,
        );

        if (search_size > 1) {
            start_section = new BoldSection(sections);
        } else {
            start_section = new ItalicSection(sections);
        }

        line_content.push(start_section);


        return end - 1;
    }

    return offset;
}
export function codeContent(raw_content: Content[]) {

    const content = [];

    for (let i = 0; i < raw_content.length; i++) {

        if (raw_content[i] instanceof InlineCode) {

            var d = tryCodeBlock(raw_content[i], raw_content, content, i, raw_content.length);

            if (d != i) {
                i = d;
                continue;
            };

            raw_content[i].type = "text";

            content.push(raw_content[i]);

            continue;
        }

        content.push(raw_content[i]);
    }

    return content;
}
function tryCodeBlock(obj, raw_content, content, offset, length) {

    let start = offset + 1;

    if (raw_content[start] == " ")
        return offset;


    for (let i = start; i < length; i++) {

        if (raw_content[i - 1] == " ")
            continue;

        if (raw_content[i].type == "inline_code") {
            const tok = Token.fromRange(obj.pos, raw_content[i].pos);

            content.push(<HTMLElementNode>{
                type: HTMLNodeType.HTML_CODE,
                tag: "CODE",
                attributes: [MD_Attribute],
                nodes: [{
                    type: HTMLNodeType.HTMLText,
                    data: escape_html_string(tok.slice().slice(1, -1)).trim(),
                    pos: tok
                }]
            });

            return i;
        }
    }

    return offset;
}


