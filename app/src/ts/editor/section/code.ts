import { EditLine } from './line';

export class CodeBlock extends EditLine {
    syntax: string;
    lines: string[];

    constructor(syntax: string, content: string[]) {
        super("code", []);
        this.syntax = syntax;
        this.lines = content;
    }
}
