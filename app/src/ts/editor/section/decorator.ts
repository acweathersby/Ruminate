import { Section } from '../types/types';
import { FormatNode } from './base/format';


export class ItalicSection extends FormatNode {

    constructor(
        sections: Section[]
    ) {
        super("i", sections);
    }

    get Type() { return ItalicSection; }

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

export class BoldSection extends FormatNode {

    constructor(
        sections: Section[]
    ) {
        super("strong", sections);
    }

    get leading_offset() {
        return 2;
    }

    get markdown_length() {
        return this.length + 4;
    }

    toString(): string {
        return `__${super.toString()}__`;
    }
}

export class InlineCode extends FormatNode {

    constructor(
        sections: Section[]
    ) {
        super("code", sections);
    }

    get leading_offset() {
        return 2;
    }

    get markdown_length() {
        return this.length + 2;
    }

    toString(): string {
        return `\`${super.toString()}\``;
    }
}
