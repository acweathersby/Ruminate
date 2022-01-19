/**
 * Labels For Tasks
 */
export enum TextCommand {
    INSERT_TEXT,
    REPLACE_TEXT,
    DELETE_TEXT_FORWARDS,
    DELETE_TEXT_BACKWARDS
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
     * Replace a current selection of text with a new string.
     * May optionally format the inserted text using the Markdown
     * formatter.
     */
    [TextCommand.REPLACE_TEXT]: {
        command: TextCommand.REPLACE_TEXT;
    };
    /**
     * ## `[Insert Text]`
     *
     * Remove a current selection of text.
     * May optionally format the inserted text using the Markdown
     * formatter.
     */
    [TextCommand.DELETE_TEXT_FORWARDS]: {
        command: TextCommand.DELETE_TEXT_FORWARDS;
    };
    [TextCommand.DELETE_TEXT_BACKWARDS]: {
        command: TextCommand.DELETE_TEXT_BACKWARDS;
    };
}


export interface HistoryTask {
    [TextCommand.REPLACE_TEXT]: {
        type: TextCommand.REPLACE_TEXT;
        redo_data: {};
        undo_data: {};
    },
    [TextCommand.DELETE_TEXT_FORWARDS]: {
        type: TextCommand.DELETE_TEXT_FORWARDS;
        redo_data: {};
        undo_data: {};
    },
    [TextCommand.DELETE_TEXT_BACKWARDS]: {
        type: TextCommand.DELETE_TEXT_BACKWARDS;
        redo_data: {};
        undo_data: {};
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
}
