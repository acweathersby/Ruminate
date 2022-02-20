import { AnchorSection } from '../section/anchor';
import { BoldSection, InlineCode, ItalicSection } from "../section/decorator";
import { EditLine } from "../section/line.js";
import { QueryDisplay } from '../section/query.js';
import { Paragraph } from '../section/paragraph.js';
import { TextSection } from '../section/text.js';
import { Section } from '../types/types';
import { CodeLine } from '../section/code';
import { Header } from '../section/header ';
export function CAN_WRAP_IN_BOLD(section: Section): boolean {
    return !(section instanceof ItalicSection) && !(section instanceof EditLine);
}

export function CAN_WRAP_IN_ITALIC(section: Section): boolean {
    return !(section instanceof ItalicSection) && !(section instanceof EditLine);
}

export function CAN_FORMAT(section: Section): boolean {
    return true;
}

export function IS_CARRET_TARGET(section: Section): section is TextSection | QueryDisplay {
    return section instanceof TextSection || section instanceof QueryDisplay;
}

export function IS_TEXT(section: Section): section is TextSection {
    return section instanceof TextSection;
}

export function IS_ATOMIC_SECTION(node: Section): node is (TextSection | QueryDisplay) {
    return node instanceof TextSection
        ||
        node instanceof QueryDisplay
        ||
        node instanceof CodeLine;
}


export function IS_TEXT_WRAPPER(section: Section):
    section is (
        Paragraph |
        ItalicSection |
        BoldSection |
        InlineCode |
        AnchorSection |
        Header
    ) {

    return IsInstanceOf(
        section,
        Paragraph,
        ItalicSection,
        BoldSection,
        InlineCode,
        AnchorSection,
        Header
    );
}

export function IsInstanceOf(s: Section, ...classes) {
    for (const c of classes)
        if (s instanceof c)
            return true;
    return false;
}

