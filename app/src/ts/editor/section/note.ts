import { Section } from '../types/types';
import { Node } from './base/node';


export class NoteSlotSection extends Node {
    query: string;

    constructor(query: string) {
        super("span", []);
        this.query = query;
        this.length = 1;
    }

    toElement(host_element?: HTMLElement): Section {
        super.toElement(host_element);
        this.ele.setAttribute("contentEditable", "false");
        this.ele.classList.add("note-insert");
        this.ele.innerText = "<data>";

        return this.next;
    }

    toString(): string {
        return `{${this.query}}`;
    }
}
