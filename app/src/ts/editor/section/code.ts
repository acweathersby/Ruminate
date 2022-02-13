import { Section } from '../types/types';
import { EditLine } from './line';

export class CodeBlock extends EditLine {
    syntax: string;
    lines: string[];

    constructor(syntax: string, content: string[]) {
        super("code", []);
        this.syntax = syntax;
        this.lines = content;
    }

    toElement(host_element?: HTMLElement): Section {

        this.ele = document.createElement("code");

        for (const line of this.lines) {
            const ele = document.createElement("pre");
            ele.innerHTML = line;
            this.ele.appendChild(ele);
        }

        if (host_element)
            host_element.appendChild(this.ele);

        return this.next;
    }

    toString(): string {
        return `\`\`\`${this.syntax}\n${this.lines.join("\n")}\n\`\`\``;
    }
}
