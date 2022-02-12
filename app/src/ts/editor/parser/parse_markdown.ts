import { complete } from "@hctoolkit/runtime";
import { Token } from '@hctoolkit/runtime/build';
import { BoldSection, Content, EditLine, ItalicSection, LineType, TextSection } from '../section/sections';
import { Section } from '../types/types';
import { AnchorEnd, AnchorMiddle, ASTType, FunctionMaps, InlineCode, Markdown, Text as MDText } from "./ast.js";
import { Bytecode, Entrypoint, ReduceNames } from "./parser_data.js";


export function parseMarkdownText(text: string): Markdown {
    const { result, err } = complete<Markdown>(text, Entrypoint.markdown, Bytecode, FunctionMaps, ReduceNames);

    if (err)
        throw err;

    return result;
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
                    if (line.content.length == 0)
                        continue;

                    const paragraph = new EditLine(convertContent(line.content), LineType.PARAGRAPH, 0);
                    paragraph.line_type = LineType.PARAGRAPH;
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
            end - search_size
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
