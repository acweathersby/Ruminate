import { get_notes_from_query } from '../../tauri/bridge';
import { Section } from '../types/types';
import { Node } from './base/node.js';

export class QueryDisplay extends Node {
    query: string;

    notes: number[];

    handler_name: string;

    straggler: Text;

    constructor(query: string, handler_name: string = "default") {

        super("span", [/* new TextSection(String.fromCodePoint(8203)) */]);

        this.query = query;
        this.notes = [];
        this.length = 1;
        this.runQuery();
        this.note_ele = null;
        this.straggler = null;
    }

    get caret_target() {
        return this.straggler;
    }

    async runQuery() {
        this.notes = await get_notes_from_query(this.query);

        if (this.ele && this.note_ele) {
            //this.ele.innerHTML == "";
            this.note_ele.innerHTML == "";
            this.setNotes();
        }
    }

    setNotes() {

        for (const note of this.notes) {
            const div = document.createElement("div");
            //this.ele.appendChild(div);
            this.note_ele.appendChild(div);
            div.innerHTML = "Hello World";
            /* debugger;
           
            const component_class = wick.rt.context.component_class.get("WkdB0g5kDfJVBktB");
            const comp = new component_class();
            // this.ele.appendChild(place_holder);
    
            comp.appendToDOM(host); */
        }
    }

    updateMetrics(offset = 0) {

        this.head = offset;
        this.tail = offset + 1;

        return this.tail;
    }

    toElement(host_element?: HTMLElement): Section {
        super.toElement(host_element);

        this.note_ele = document.createElement("div");
        this.note_ele.setAttribute("contentEditable", "false");
        //this.ele.setAttribute("contentEditable", "false");

        this.ele.classList.add("query-field");

        this.ele.appendChild(this.note_ele);

        this.straggler = new Text(String.fromCodePoint(8203));

        this.ele.appendChild(this.straggler);

        this.setNotes();

        return this.next;
    }

    toString(): string {
        return `{${this.query}}`;
    }
}
