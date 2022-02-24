import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from '@codemirror/basic-setup';
import { MDNode, NodeType, NodeMeta } from "./md_node";
import { clone } from './operators';

type Code = MDNode<NodeType.CODE_BLOCK>;

/**
 * Ensure code data is initialized
 */
export function getCodeMeta(
    node: Code
): NodeMeta[NodeType.CODE_BLOCK] {

    let meta = node.meta;

    if (!meta.state) {
        meta.state = EditorState.create(
            {
                doc: meta.text,
                extensions: [
                    basicSetup
                ]
            }
        );
        node.meta = meta;
    }

    return meta;
}

export function createView(
    node: Code,
    host_ele: HTMLElement
): EditorView {

    const meta = getCodeMeta(node);

    if (!meta.view) {
        meta.view = new EditorView({
            parent: host_ele,
            state: meta.state
        });
    } else {
        meta.view.setState(meta.state);
        host_ele.appendChild(meta.view.dom);

    }

    node.meta = meta;

    return meta.view;
}

export function getLength(node: Code): number {

    const { state } = getCodeMeta(node);

    return state.doc.length;
}

export function getText(node: Code): string {

    const { state } = getCodeMeta(node);

    return state.doc.toString();
}

export function setSelection(node: Code, start: number, end: number = start) {

    const meta = getCodeMeta(node);

    if (start == end) {

        meta.view.dispatch(meta.view.state.update({ selection: { anchor: start } }));

    } else {

        meta.view.dispatch({ selection: { anchor: start, head: end } });
    }
}

export function getSyntax(node: Code): string {
    return getCodeMeta(node).syntax;
}
export function insertText(code: Code, offset: number, text: string): Code {

    const new_node = clone(code);

    const meta = getCodeMeta(new_node);

    const transaction = meta.view.state.update({ changes: { from: offset, insert: text } });

    meta.view.dispatch(transaction);

    meta.state = meta.view.state;

    new_node.length = meta.state.doc.length;

    new_node.meta = meta;

    return new_node;
}
/*
removeText(md_offset_start: number, md_offset_end: number) {
    const pos_start = md_offset_start - this.head - 1;
    const pos_end = md_offset_end - this.head - 1;
    const transaction = this.view.state.update({ changes: { from: pos_start, to: pos_end, insert: "" } });
    this.view.dispatch(transaction);
    this.editor_state = transaction.state;
    this.length -= pos_end - pos_start;
} */