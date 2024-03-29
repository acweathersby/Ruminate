import { ASTNode, complete, state_index_mask } from "@hctoolkit/runtime";
import { Token } from '@hctoolkit/runtime';
import { LineNode, MDNode, NodeType } from '../task_processors/md_node';
import { newNode } from '../task_processors/operators';
import {
    AnchorEnd,
    AnchorMiddle,
    ASTType,
    c_Content,
    FunctionMaps, Header as MDHeader, Markdown, Text as MDText
} from "./ast.js";
import {
    Bytecode,
    Entrypoint,
    ExpectedTokenLookup,
    ReduceNames,
    TokenLookup
} from "./parser_data.js";

const {
    ANCHOR,
    BOLD,
    CODE_BLOCK,
    CODE_INLINE,
    HEADER,
    IMAGE,
    ITALIC,
    ORDERED_LIST,
    PARAGRAPH,
    QUERY,
    QUOTE,
    TEXT,
    UNORDERED_LIST,
    UNDEFINED
} = NodeType;


const { md } = Entrypoint;

export function parseMarkdownText(text: string): Markdown {

    const { result, err } = complete<Markdown>(text, md, Bytecode, FunctionMaps, ReduceNames);

    if (err) {

        const index = err.last_state & state_index_mask;

        let expected = "";

        let token = new Token(text, err.tk_length || 1, err.tk_offset, 0);

        if (ExpectedTokenLookup.has(index)) {
            expected = ExpectedTokenLookup.get(index)?.map(v => TokenLookup.get(v)).join(" | ");
        }

        if (token.toString() == " ")
            token.throw(`Expected [ ${expected} ] but found a space.`);
        else if (err.tk_offset >= text.length)
            token.throw(`Expected [ ${expected} ] but encountered the end of the input.`);
        else
            token.throw(`Expected [ ${expected} ] but found [ ${token} ]`);
    }

    return result;
}

export function getText(obj: any): string {
    if (obj instanceof ASTNode)
        switch (obj.type) {
            case ASTType.InlineCode:
                return "`";
            case ASTType.AnchorStart:
                return "[";
            case ASTType.AnchorImageStart:
                return "![";
            case ASTType.AnchorMiddle:
                return "](";
            case ASTType.AnchorEnd:
                return ")";
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
            case ASTType.Header:
                if (obj instanceof MDHeader)
                    return "#".repeat(obj.length);
        }
    else return obj.toString();
    return "";
}

const undefined_node = newNode(UNDEFINED);

export function convertMDASTToEditLines(md: Markdown, gen = 0): LineNode[] {

    const lines: MDNode[] = [];

    let prev: MDNode = undefined_node;

    let head = null;

    let accumulator = [];

    function parseNonCodeLine() {
        if (head) {
            const
                contents: c_Content[] = [...head.content, ...accumulator.flatMap(h => h.content)],
                [first] = contents;

            let new_node: MDNode = null;

            switch (head.type) {
                case ASTType.Quote: {
                    first.value = first.value.slice(1);
                    new_node = newNode(QUOTE, [], gen, head.length);
                    break;
                }
                case ASTType.OL:
                    first.value = first.value.slice(1);
                    new_node = newNode(ORDERED_LIST, [], gen, head.length);
                    break;
                case ASTType.UL:
                    first.value = first.value.slice(1);
                    new_node = newNode(UNORDERED_LIST, [], gen, head.length);
                    break;
                case ASTType.Header: {
                    // Enforce that at least one space character proceed the 
                    // # chars
                    if (!first || head.length > 6 || first.type != ASTType.Text || first.value[0] !== " ") {
                        contents.unshift(new MDText(getText(head)));
                        new_node = newNode(PARAGRAPH, [], gen);
                    } else {
                        //Remove leading space
                        first.value = first.value.slice(1);
                        new_node = newNode(HEADER, [], gen, head.length);
                    }
                } break;
                case ASTType.Paragraph: {
                    //If the head data is empty then ignore it. 
                    if (head.content.length == 0)
                        break;
                    new_node = newNode(PARAGRAPH, [], gen);
                } break;
            }

            if (new_node) {
                new_node.children = convertContent(contents, gen);
                lines.push(new_node);
            }
        }


        head = null;
        accumulator.length = 0;
    }

    for (const line of md.lines) {

        if (line.type == ASTType.CodeBlock) {

            parseNonCodeLine();

            prev = newNode(CODE_BLOCK,
                [],
                gen,
                {
                    view: null,
                    state: null,
                    syntax: getText(line.syntax),
                    text: line.data.map(getText).join("\n"),
                }
            );
            head = null;
            accumulator.length = 0;
            lines.push(prev);
        } else if (
            line.type == ASTType.EmptyLine
            ||
            (
                head &&
                (
                    line.type !== head.type
                    &&
                    line.type !== ASTType.Paragraph
                )
            )
        ) {
            parseNonCodeLine();
        } else if (!head) {
            head = line;
        } else {
            accumulator.push(line);
        }
    }

    parseNonCodeLine();

    return <LineNode[]>lines;
}

export function convertContent(raw_content: c_Content[], gen: number) {
    return convertOuterContent(raw_content, gen);
}


export function convertOuterContent(
    raw_content: (c_Content | MDNode)[],
    gen: number,
    offset: number = 0,
    length: number = raw_content.length
) {

    const line_contents: MDNode[] = [];

    outer: for (let i = offset; i < length; i++) {

        const obj = raw_content[i];

        if (obj instanceof MDNode) {
            line_contents.push(obj);
            continue;
        }


        switch (obj.type) {
            case ASTType.InlineCode: {

                const d = getInlineCounterpart(raw_content, i, raw_content.length);

                if (d != i) {
                    const str = raw_content.slice(i + 1, d).map(getText).join("");
                    line_contents.push(newNode(TEXT, [], gen, str));
                    i = d;
                };

            } break;
            case ASTType.MarkerA:
            case ASTType.MarkerB:
                {
                    const d = tryFormat(obj.type, raw_content, line_contents, gen, i, length);
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


                        if (mid >= 0 && obj2 instanceof AnchorEnd) {
                            end = j;
                            break;
                        }

                    }

                    if (mid - 1 > 0 && mid > 0 && mid < end && end > i) {
                        const content = raw_content.slice(i + 1, mid);
                        const data = raw_content.slice(mid + 1, end);

                        if (obj.type == ASTType.AnchorImageStart) {
                            newNode(
                                IMAGE,
                                convertOuterContent(raw_content, gen, i + 1, mid),
                                gen,
                                data.map(getText).join("")
                            );
                        } else {
                            line_contents.push(
                                newNode(
                                    ANCHOR,
                                    convertOuterContent(raw_content, gen, i + 1, mid),
                                    gen,
                                    data.map(getText).join("")
                                )
                            );
                        }

                        i = end;

                    } else {
                        line_contents.push(newNode(TEXT, [], gen, getText(obj)));
                    }
                }
                break;
            case ASTType.QueryStart:
                for (let j = i + 1; j < length; j++) {
                    let end = raw_content[j];
                    if (end.type == ASTType.QueryEnd) {
                        const data = raw_content.slice(i + 1, j);
                        line_contents.push(newNode(QUERY, [], gen, data.map(getText).join("")));
                        i = j;
                        continue outer;
                    }
                }
                //Temporary
                line_contents.push(newNode(TEXT, [], gen, getText(obj)));
                break;
            case ASTType.AnchorMiddle:
            case ASTType.AnchorEnd:
            case ASTType.QueryEnd:
            case ASTType.Text:
                line_contents.push(newNode(TEXT, [], gen, getText(obj)));
                break;
            case ASTType.InlineCode:
                //Temporary
                line_contents.push(newNode(TEXT, [], gen, getText(obj)));
                break;
        }

    }

    return line_contents;
}
function tryFormat(
    type: ASTType,
    raw_content: (c_Content | MDNode)[],
    line_content: MDNode[],
    gen: number,
    offset: number,
    length: number
) {

    let start = offset + 1;
    let search_size = 1;

    for (let i = start; i < length; i++) {
        const obj = raw_content[i];
        if (obj.type == CODE_INLINE) continue;
        if (obj.type !== type) { start = i; break; };
    }

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
        const i_obj = raw_content[i];
        const node = raw_content[i - 1];
        if (i_obj.type == CODE_INLINE) continue;
        if (
            i_obj.type == type
            &&
            !(node instanceof MDText && node.value[node.value.length - 1] == " ")
        ) {

            let
                j = i + 1,
                j_obj = raw_content[j];

            while (
                j < length
                && !(j_obj.type == CODE_INLINE)
                && j_obj.type == type
            ) { j++; j_obj = raw_content[j]; };

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

        var start_section: MDNode;

        const sections = convertOuterContent(
            raw_content,
            gen,
            offset + search_size,
            end - search_size
        );

        if (search_size > 1) {
            start_section = newNode(BOLD, sections, gen);
        } else {
            start_section = newNode(ITALIC, sections, gen);
        }

        line_content.push(start_section);

        return end - 1;
    }

    return offset;
}
function getInlineCounterpart(raw_content: (c_Content | MDNode)[], offset, length) {

    for (let i = offset + 2; i < length; i++) {
        const i_obj = raw_content[i];
        if (i_obj instanceof MDNode)
            return i;
    }

    return offset;
}
