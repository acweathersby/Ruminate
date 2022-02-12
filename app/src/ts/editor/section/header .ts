import { Section } from '../types/types';
import { EditLine } from './line';

/**
 * Headers are block level elements that 
 * can denote a new section or sub-section
 * of a document.
 */
export class Header extends EditLine {

    level: number;

    constructor(level: number, sections: Section[]) {
        super("h" + level, sections);
        this.level = level;

    }

    toString(): string {
        return `${"#".repeat(this.level)} ${super.toString()}`;
    }
};
