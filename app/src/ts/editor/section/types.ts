import {
    AnchorEnd,
    AnchorImageStart,
    AnchorMiddle,
    AnchorStart,
    InlineCode,
    MarkerA,
    MarkerB,
    QueryEnd,
    QueryStart,
    Text as MDText
} from "../parser/ast.js";

/**
 * Sections
 * - Paragraph
 * - Codeblock
 */
///

export type Content = MDText |
    MarkerA |
    MarkerB |
    QueryStart |
    QueryEnd |
    InlineCode |
    AnchorStart |
    AnchorImageStart |
    AnchorMiddle |
    AnchorEnd;

export const enum LineType {
    PARAGRAPH,
    CODEBLOCK,
    QUOTE,
    HEADER,
    QUERY
}

export const enum TextClass {
    bold = 1,
    italic = 2,
    underline = 4
}
