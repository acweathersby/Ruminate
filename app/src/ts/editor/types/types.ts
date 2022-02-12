import { EditLine } from "../section/line";
import { TextSection } from "../section/text";
import { SectionBase } from "../section/base/base";
import { BoldSection, InlineCode, ItalicSection } from '../section/decorator';

export type Section = SectionBase | TextSection | EditLine | InlineCode | BoldSection | ItalicSection;

