import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, highlightSpecialChars } from '@codemirror/view';
import { lineNumbers } from '@codemirror/gutter';
import { defaultHighlightStyle } from '@codemirror/highlight';
import { javascript } from "@codemirror/lang-javascript";

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
                    //basicSetup,
                    defaultHighlightStyle,
                    highlightSpecialChars({}),
                    lineNumbers({}),
                    (new Compartment).of(javascript({ typescript: true })),

                    //defaultHighlightStyle,
                    //drawSelection()
                ]
            }
        );

        node.meta = meta;
    }

    return meta;
}

export function getElementAtOffset(code: Code, offset: number): {
    node: MDNode,
    ele: Node,
    offset: number;
} {

    const meta = getCodeMeta(code);

    const { node, offset: ele_offset } = meta.view.domAtPos(offset);

    return { ele: node, offset: ele_offset, node: code };
}

export function createView(
    node: Code,
    host_ele: HTMLElement
): EditorView {

    const meta = getCodeMeta(node);

    if (!meta.view) {
        meta.view = new EditorView({
            parent: host_ele,
            state: meta.state,
        });

    } else {
        meta.view.setState(meta.state);
        host_ele.appendChild(meta.view.dom);
    }

    meta.view.dom.removeAttribute("contenteditable");

    //The announce DOM is used to announce changes in a codemirror
    //editor. However, this element disrupts document flow when using
    //native selection, so we disable it to allow correct offset measurements
    //@ts-ignore
    meta.view.announceDOM.style.display = "none";

    for (const gutter of meta.view.dom.querySelectorAll(".cm-gutters")) {
        gutter.setAttribute("contenteditable", "false");
        //@ts-ignore
        gutter.style.userSelect = 'none';
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
        meta.view.dispatch(meta.view.state.update({ selection: { anchor: end, head: start } }));

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

export function removeText(code: Code, offset: number, length: number): Code {

    const new_node = clone(code);

    const meta = getCodeMeta(new_node);

    const transaction = meta.view.state.update({ changes: { from: offset, to: offset + length, insert: "" } });

    meta.view.dispatch(transaction);

    meta.state = meta.view.state;

    new_node.length = meta.state.doc.length;

    new_node.meta = meta;

    return new_node;
}