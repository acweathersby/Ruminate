import { InsertDiff, DeleteDiff } from '../task_processors/history/changes';
import { MDNode, NodeType } from '../task_processors/md_node';

/**
 * Labels For Tasks
 */
export enum TextCommand {
    INSERT_TEXT,
    INSERT_PARAGRAPH,
    DELETE_TEXT,
    TOGGLE_ITALICS,
    TOGGLE_BOLD,
    SET_HEADER_SIZE,
}
export interface HistoryTask {
    state: MDNode<NodeType.ROOT>,
    start_offset: number,
    end_offset: number;
    diffs: (DeleteDiff | InsertDiff)[];
    clock: number;
}