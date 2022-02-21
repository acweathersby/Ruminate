import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { MDNode, NodeType, NodeMeta } from "./md_node";

type Code = MDNode<NodeType.CODE_BLOCK>;

/**
 * Ensure code data is initialized
 */
export function getCodeMeta(
    node: Code
): NodeMeta[NodeType.CODE_BLOCK] {

    let { state, syntax, text } = node.meta;

    if (!state) {
        state = EditorState.create(
            {
                doc: text,
                extensions: [
                    //basicSetup
                ]
            }
        );
    }

    return { state, syntax, text };
}

export function createView(
    node: Code,
    host_ele: HTMLElement
):
    EditorView {

    const { state, text, syntax } = getCodeMeta(node);

    const view = new EditorView({
        parent: host_ele,
        state: state
    });

    node.meta = {
        state: view.state,
        text,
        syntax
    };

    return view;
}

export function getLength(node: Code): number {

    const { state } = getCodeMeta(node);

    return state.doc.length;
}

export function getText(node: Code): string {

    const { state } = getCodeMeta(node);

    return state.doc.toString();
}

export function getSyntax(node: Code): string {
    return getCodeMeta(node).syntax;
}
/* insertText(md_offset: number, text: string) {
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
} */