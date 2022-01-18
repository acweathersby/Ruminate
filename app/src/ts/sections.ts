import {
    AnchorEnd,
    AnchorImageStart,
    AnchorMiddle,
    AnchorStart,
    ASTType,
    CodeBlock,
    Header,
    InlineCode,
    Line,
    Markdown,
    MarkerA,
    MarkerB,
    Paragraph as MDParagraph,
    QueryEnd,
    QueryStart,
    Quote,
    Text as MDText
} from "./ast.js";
import { Section } from './types/types';
import { EditHost } from "./types/edit_host";

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

const enum LineType {
    PARAGRAPH,
    CODEBLOCK,
    QUOTE,
    HEADER,
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

    constructor() {
        this.length = 0;
        this.ele = null;
        this.DIRTY = false;
        this.parent = null;
        this.prev = null;
        this.next = null;
        this.first_child = null;
        this.last_child = null;
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

    link(prev: Section | null, parent: Section) {

        if (this.prev) {

            if (prev == this.prev)
                return;

            this.prev.next = this.next;
            if (this.next)
                this.next.prev = this.prev;

            if (this.parent) {
                if (!this.prev)
                    this.parent.first_child = this.next;
                if (!this.next)
                    this.parent.last_child = this.prev;
            }

            this.prev = null;
            this.next = null;
        }

        this.parent = parent;

        if (!prev) {
            const next = parent.first_child;

            if (next) {
                next.prev = this;
            } else {
                parent.last_child = this;
            }

            this.next = next;

            parent.first_child = this;

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

    get leading_offset() {
        return 0;
    }

    get children() {
        return [...this.first_child.traverse_horizontal()];
    }

    /**
     * Returns a generator that yields this node and its siblings.
     */
    *traverse_horizontal(loop: boolean = false): Generator<Section> {
        yield this;
        let node = this.next;
        while (node && node != this) {
            yield node;
            node = node.next;
            if (!node && loop && this.parent) {
                node = this.parent.first_child;
            }
        }
    }

    hasSingleChild(): boolean {
        return this.last_child !== null && this.last_child == this.first_child;
    }

    numberOfChildren(): number {
        if (this.first_child)
            return [...this.first_child.traverse_horizontal()].length;
        return 0;
    }

    updateLength(): number {
        return this.length;
    }

    get markdown_length() {
        return this.length;
    }

    getHeadOffset(USE_MARKDOWN_OFFSETS: boolean = false, __offset__: number = 0) {

        let prev = this.prev;

        while (prev) {
            if (USE_MARKDOWN_OFFSETS)
                __offset__ += prev.markdown_length;
            else __offset__ += prev.length;
            prev = prev.prev;
        }

        if (this.parent)
            return this.parent.getHeadOffset(USE_MARKDOWN_OFFSETS, __offset__);

        return __offset__;
    }

    getTailOffset(USE_MARKDOWN_OFFSETS: boolean = false) {
        return (USE_MARKDOWN_OFFSETS ? this.markdown_length : this.length)
            + this.getHeadOffset(USE_MARKDOWN_OFFSETS);
    }
    /**
     * Returns `true` if the givin offset is within the bounds of
     * node. If the node is zero length, then returns `true` if
     * the offset is equal to the node's offset.
     */
    overlaps(offset: number) {
        return this.getHeadOffset() <= offset && this.getTailOffset() >= offset;
    }
}

export const enum TextClass {
    bold = 1,
    italic = 2,
    underline = 4,
}

export class TextSection extends SectionBase {
    text: string;
    parts: Section[];

    ele: Text;
    constructor(text: string = "") {
        super();
        this.text = text;
        this.length = text.length;
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
        this.ele.data = this.text;

        if (host_element)
            host_element.appendChild(this.ele);

        return this.next;
    }

    updateLength() {
        this.length = this.text.length;
        return this.length;
    }

    toString(pre_existing_class) {

        return this.text;
    }
    /**
     * If the split point is within the text segment then
     * this node is split into two nodes that represent the 
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
     * Removes a segment of characters of `length` starting at `offset`
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

    toString(): string {
        if (this.first_child)
            return [...this.first_child.traverse_horizontal()].join("");
        return "";
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

    constructor(sections: Section[], type: LineType, meta_value: number = 0) {
        super({
            [LineType.PARAGRAPH]: "p",
            [LineType.CODEBLOCK]: "pre",
            [LineType.HEADER]: "h" + meta_value,
            [LineType.QUOTE]: "quote",
        }[type], sections);

        this.type = type;
    }

    toElement(host_element?: HTMLElement): Section | null {
        if (this.type == LineType.CODEBLOCK) {
            return this.next;
        } else {
            return super.toElement(host_element);
        }
    }
}

export class ParagraphSection extends Node {
    constructor(sections?: Section[]) {
        super(0, "p", sections);
    }

    toString(): string {
        return `\n${super.toString()}`;
    }
    get markdown_length() {
        return this.length + 1;
    }
}

export class ItalicSection extends SectionBase {

    linked: ItalicSection | null;

    IS_START: boolean;

    constructor() {
        super();
        this.IS_START = false;
        this.length = 0;
    }

    linkEnd(end: ItalicSection) {
        if (end.linked)
            throw new Error(`${this.constructor.name} already linked`);
        end.linked = this;
        this.linked = end;
        this.IS_START = true;
    }

    get leading_offset() {
        return 1;
    }

    get markdown_length() {
        return this.length + 2;
    }

    toString(): string {
        return `_`;
    }

    toElement(host_element?: HTMLElement): Section | null {

        this.ele = this.createElement("i");

        for (
            let node = this.next;
            node != this.linked && node;
            node = node.toElement(this.ele)
        );


        if (host_element)
            host_element.appendChild(this.ele);

        return this.linked.next;
    }
}

export class BoldSection extends SectionBase {

    linked: BoldSection | null;

    IS_END: boolean;

    constructor() {
        super();
        this.IS_END = false;
    }

    linkEnd(end: BoldSection) {
        if (end.linked)
            throw new Error(`${this.constructor.name} already linked`);
        end.IS_END = true;
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

export class CodeblockSection extends SectionBase {
    constructor(length: number, line?: Line) {
        super(length);

        if (line) {
            if (line.header instanceof ParagraphSection) {
            }
            else
                throw new Error("Markdown Line header is not a Paragraph");
        }
    }
}

export function convertMDASTToEditLines(md: Markdown, edit_host: EditHost) {

    for (const line of md.lines) {
        if (line.node_type == ASTType.Line)
            switch (line.header.node_type) {
                case ASTType.Header:
                    break;
                case ASTType.Ol:
                case ASTType.Ul:
                    break;
                case ASTType.Paragraph:
                    const paragraph = new EditLine(convertContent(line.content), LineType.PARAGRAPH, 0);
                    paragraph.type = LineType.PARAGRAPH;
                    edit_host.sections.push(paragraph);
                    break;
            }
        else {

        }
    }
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

        var start_section, end_section;

        if (search_size > 1) {
            start_section = new BoldSection();
            end_section = new BoldSection();
        } else {
            start_section = new ItalicSection();
            end_section = new ItalicSection();
        }

        start_section.linkEnd(end_section);

        line_content.push(start_section,
            ...convertOuterContent(
                raw_content,
                offset + search_size,
                end - search_size,
            ), end_section
        );


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


