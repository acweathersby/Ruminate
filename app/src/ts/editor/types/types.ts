import { EditLine } from "../section/line";
import { TextSection } from "../section/text";
import { SectionBase } from "../section/base/base";

export type Section = SectionBase | TextSection | EditLine;

