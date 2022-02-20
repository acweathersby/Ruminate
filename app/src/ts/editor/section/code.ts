import { basicSetup, EditorView } from "@codemirror/basic-setup";
import { EditorSelection, EditorState, Facet } from "@codemirror/state";
import { setZeroLengthSelection } from '../task_processors/common';
import { EditHost } from '../types/edit_host';
import { Section } from '../types/types';
import { EditLine } from './line';

export class CodeLine extends EditLine {
    syntax: string;
    lines: string[];

    editor_state: EditorState;

    view: EditorView;

    edit_host: EditHost;

    constructor(syntax: string, content: string[], edit_host: EditHost) {
        super("div", []);
        this.syntax = syntax;
        this.lines = content;
        this.length = this.lines.join("\n").length;
        this.editor_state = null;
        this.edit_host = edit_host;
    }

    handleEvent(n: CodeMirror.Editor, e: Event) {
        console.log("A");
        return null;
    }

    initEditor() {
        this.editor_state = EditorState.create(
            {
                doc: this.lines.join("\n"),
                extensions: [
                    //basicSetup
                ]
            }
        );

        this.view = new EditorView({
            parent: this.ele,
            state: this.editor_state
        });
    }

    toElement(host_element?: HTMLElement): Section {

        if (!this.ele) {
            super.toElement(host_element);

            this.ele.setAttribute("contentEditable", "false");

            this.initEditor();

            this.ele.classList.add("code-field");
        }

        if (host_element)
            host_element.appendChild(this.ele);

        return this.next;
    }

    toString(): string {
        if (this.view)
            return `\`\`\`${this.syntax}\n${this.view.state.doc.toString()}\n\`\`\``;
    }

    slice(md_offset_start: number, md_offset_end: number): string {
        const pos_start = md_offset_start - this.head - 1;
        const pos_end = md_offset_end - this.head - 1;
        return this.view.state.sliceDoc(pos_start, pos_end);
    }

    updateMetrics(offset?: number): number {
        this.head = offset;
        this.tail = offset + this.length + 1;
        return this.tail;
    }

    getOffset(): number {
        return this.head;
    }

    setOffset(md_offset: number) {
        const cursor_position = md_offset - this.head - 1;
        const { node, offset } = this.view.domAtPos(cursor_position);
        setZeroLengthSelection(node, offset);
    }

    insertText(md_offset: number, text: string) {
        const cursor_position = md_offset - this.head - 1;
        const transaction = this.view.state.update({ changes: { from: cursor_position, insert: text } });
        this.view.dispatch(transaction);
        this.editor_state = transaction.state;
        this.length += text.length;
    }

    removeText(md_offset_start: number, md_offset_end: number) {
        const pos_start = md_offset_start - this.head - 1;
        const pos_end = md_offset_end - this.head - 1;
        const transaction = this.view.state.update({ changes: { from: pos_start, to: pos_end, insert: "" } });
        this.view.dispatch(transaction);
        this.editor_state = transaction.state;
        this.length -= pos_end - pos_start;
    }
}

