import { EditHost } from "../../types/edit_host";
import { TextCommand } from "../../types/text_command_types";
import { NodeClass, NodeType } from '../md_node';
import { traverse } from '../traverse/traverse';
import { registerAction } from './register_action';


function insertParagraph(edit_host: EditHost) {
    for (const { node, meta: { overlap_start, replace } } of
        traverse(edit_host.root)
            .classFilter(NodeClass.LINE)
            .rangeFilter(edit_host.start_offset, edit_host.start_offset)
            .extract(edit_host)
            .makeReplaceable()
    ) {

        if (node.is(NodeType.CODE_BLOCK)) {

        } else if (node.is(NodeType.HEADER)) {

        } else if (node.is(NodeType.PARAGRAPH)) {

        } else if (node.is(NodeType.ORDERED_LIST)) {

        } else if (node.is(NodeType.UNORDERED_LIST)) {

        }
    }
};



registerAction("edit", TextCommand.INSERT_PARAGRAPH, insertParagraph);