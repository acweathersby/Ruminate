import { Section } from '../types/types';
import { EditLine } from './line';
import CodeMirror from "codemirror";

export class CodeBlock extends EditLine {
    syntax: string;
    lines: string[];

    constructor(syntax: string, content: string[]) {
        super("div", []);
        this.syntax = syntax;
        this.lines = content;
    }

    toElement(host_element?: HTMLElement): Section {

        super.toElement(host_element);

        this.ele.setAttribute("contentEditable", "false");

        this.ele.classList.add("code-field");

        const obj = CodeMirror(this.ele, {
            value: this.lines.join("\n"),
            mode: "plain-text",
        });
        setTimeout(() =>

            obj.refresh(), 1);

        if (host_element)
            host_element.appendChild(this.ele);

        return this.next;
    }

    toString(): string {
        return `\`\`\`${this.syntax}\n${this.lines.join("\n")}\n\`\`\``;
    }
}
