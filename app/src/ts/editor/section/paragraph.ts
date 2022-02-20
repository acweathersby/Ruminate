import { Section } from '../types/types';
import { EditLine } from './line';

export class Paragraph extends EditLine {
    constructor(content: Section[] = []) {
        super("p", content);
    }

    get Type(): any {
        return Paragraph;
    }
}
