/**
 * Labels For Tasks
 */
export enum TextCommand {
    INSERT_TEXT,
    INSERT_PARAGRAPH,
    DELETE_TEXT,
    TOGGLE_ITALICS,
    TOGGLE_BOLD,
}
export interface TextCommandTask {
    /**
     * ## `[Insert Text]`
     *
     * Inserts a new string of text within the target note.
     * May optionally format the inserted text with using the Markdown
     * formatter.
     */
    [TextCommand.INSERT_TEXT]: {
        command: TextCommand.INSERT_TEXT;
        data: HistoryTask[TextCommand.INSERT_TEXT]["redo_data"];
    };
    /**
     * ## `[Insert Text]`
     *
     * Inserts a new string of text within the target note.
     * May optionally format the inserted text with using the Markdown
     * formatter.
     */
    [TextCommand.INSERT_PARAGRAPH]: {
        command: TextCommand.INSERT_PARAGRAPH;
        data: HistoryTask[TextCommand.INSERT_PARAGRAPH]["redo_data"];
    };
    /**
     * ## `[Delete Text]`
     *
     * Remove a current selection of text.
     * May optionally format the inserted text using the Markdown
     * formatter.
     */
    [TextCommand.DELETE_TEXT]: {
        command: TextCommand.DELETE_TEXT;
        data: HistoryTask[TextCommand.DELETE_TEXT]["redo_data"];
    };
    /**
     * ## `[Toggle Italics]`
     *
     * Remove a current selection of text.
     * May optionally format the inserted text using the Markdown
     * formatter.
     */
    [TextCommand.TOGGLE_ITALICS]: {
        command: TextCommand.TOGGLE_ITALICS;
        data: HistoryTask[TextCommand.TOGGLE_ITALICS]["redo_data"];
    };
    /**
         * ## `[Toggle Italics]`
         *
         * Remove a current selection of text.
         * May optionally format the inserted text using the Markdown
         * formatter.
         */
    [TextCommand.TOGGLE_BOLD]: {
        command: TextCommand.TOGGLE_BOLD;
        data: HistoryTask[TextCommand.TOGGLE_BOLD]["redo_data"];
    };

}

export interface Range {
    /**
     * The start point of the selection range
     */
    start_offset: number;
    /**
     * The end point of the selection range
     */
    end_offset: number;
};

export const enum FormatType {
    UNDEFINED,
    ADD,
    REMOVE
}

export interface HistoryTask {
    [TextCommand.DELETE_TEXT]: {
        type: TextCommand.DELETE_TEXT;
        /**
         * Necessary information needed to perform/redo actions performed
         * by the `[Delete Text]` command.
         */
        redo_data: {
            /**
             * Level of complexity involved in deleting Markdown content.
             */
            complexity: DeletionComplexity;
            /**
             * The starting offset of the region of text that should be remove.
             */
            offset?: number;
            /**
             * The length of the region of text that is to be removed
             */
            length: number;

        };
        /**
         * Necessary information needed to undo actions performed
         * by the [Delete Text] command.
         */
        undo_data: {
            /**
             * Level of complexity involved in restoring
             * Markdown content.
             */
            complexity: DeletionComplexity;
            /**
             * The offset at which text data will be restored.
             */
            offset?: number;
            /**
             * The original length of the deleted region
             */
            original_length: number;
            /**
             * The original text data that was removed.
             */
            input_text: string;
            /**
             * 
             */
            first_edit_line?: number;
            last_edit_line?: number;
        };
    },

    [TextCommand.INSERT_TEXT]: {
        type: TextCommand.INSERT_TEXT,
        /**
         * Necessary information needed to perform/redo actions performed
         * by the `[Insert Text]` command.
         */
        redo_data: {
            /**
             * The string data 
             */
            input_text: string;
            /**
             * The the point at which new text should be inserted.
             */
            offset: number;
            /**
             * If `true` the Markdown formatter should be used to format
             * the input_text.
             */
            APPLY_MARKDOWN_FORMAT: boolean;
        };
        /**
         * Necessary information needed to undo actions performed
         * by the [Insert Text] command.
         */
        undo_data: {
            /**
             * The start point of a selection field inclosing the
             * the text data that was inserted by the `[Insert Text]`
             * command.
             */
            offset_start: number;
            /**
             * The end point of a selection field inclosing
             * the text data that was inserted by the `[Insert Text]`
             * command.
             */
            offset_end: number;
            /**
             * The number of characters that where inserted by the
             * `[Insert Text]` command
             */
            length: number;
        };
    };

    [TextCommand.TOGGLE_BOLD]: {
        type: TextCommand.TOGGLE_BOLD,
        /**
         * Necessary information needed to perform/redo actions performed
         * by the `[Toggle Bold]` command.
         */
        redo_data: { type: FormatType, ranges: Range[]; };
        /**
         * Necessary information needed to undo actions performed
         * by the [Toggle Bold] command.
         */
        undo_data: { type: FormatType, ranges: Range[]; };
    };

    [TextCommand.TOGGLE_ITALICS]: {
        type: TextCommand.TOGGLE_ITALICS,
        /**
         * Necessary information needed to perform/redo actions performed
         * by the `[Toggle Italics]` command.
         */
        redo_data: { type: FormatType, ranges: Range[]; };
        /**
         * Necessary information needed to undo actions performed
         * by the [Toggle Italics] command.
         */
        undo_data: { type: FormatType, ranges: Range[]; };
    };

    [TextCommand.INSERT_PARAGRAPH]: {
        type: TextCommand.INSERT_PARAGRAPH,
        /**
         * Necessary information needed to perform/redo actions performed
         * by the `[Insert Text]` command.
         */
        redo_data: {
            /**
             * The the point at which the new paragraph should be inserted.
             */
            offset: number;
        };
        /**
         * Necessary information needed to undo actions performed
         * by the [Insert Text] command.
         */
        undo_data: {
            /**
             * The offset of the start of the new paragraph
             */
            offset: number;
        };
    };
}

/**
 * Levels of complexity involved in deleting and restoring
 * Markdown content.
 */
export const enum DeletionComplexity {
    UNDEFINED,
    /**
     * Deletion is completely confined to a single text section.
     */
    TEXT_SECTION,
    /**
     * Deletion occurs across multiple sections within a single EditLine
     */
    SECTION_OVERLAP,
    /**
     * Deletion occurs across multiple sections and multiple edit lines.
     */
    EDIT_LINE_OVERLAP

}