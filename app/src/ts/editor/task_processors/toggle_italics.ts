import { ItalicSection } from "../section/decorator";
import { EditHost } from "../types/edit_host";
import { FormatType, HistoryTask, TextCommand, TextCommandTask } from "../types/text_command_types";
import { updateMetrics, updateUIElements } from './common.js';
import { CAN_FORMAT, CAN_WRAP_IN_ITALIC } from './format_rules.js';
import { addOperation } from './history.js';
import { modifySections } from './modify_sections';
import { registerTask } from './register_task.js';

type ToggleItalicsTask = TextCommandTask[TextCommand.TOGGLE_ITALICS];


function toggleItalics(command: ToggleItalicsTask, edit_host: EditHost) {

    // Determine if the region to be selected is contained within a continues line of 
    // Italics. 
    //
    let {
        ranges: [{ start_offset, end_offset }]
    } = command.data;

    let ranges = command.data.ranges;

    const italics = [];

    modifySections(edit_host.root, start_offset, end_offset, {
        on_text_segment: (s, start, end, mf) => { },
        on_section_segment: (s, start, end, mf) => {
            if (s instanceof ItalicSection) {
                italics.push(s);
            } else
                modifySections(s, start, end, mf);
        },
        on_seg_overlap: (s, start, end, mf) => {
            if (s instanceof ItalicSection) {
                italics.push(s);
            } else
                modifySections(s, start, end, mf);
        },
    });

    let ADD_ITALICS = italics.length == 0;

    if (italics.length > 0) {

        ranges = [];

        const { head } = italics[0];
        const { tail } = italics[italics.length - 1];

        if (start_offset < head) {
            ADD_ITALICS = true;
            ranges.push({ start_offset, end_offset: head });
        }

        for (let i = 0; i < italics.length - 1; i++) {
            let { tail } = italics[i];
            let { head } = italics[i + 1];

            if (tail != head) {
                ADD_ITALICS = true;
                ranges.push({ start_offset: tail, end_offset: head });
            }
        }

        if (end_offset > tail) {
            ADD_ITALICS = true;
            ranges.push({ start_offset: tail, end_offset });
        }

        if (ranges.length == 0 && !ADD_ITALICS) {
            ranges = command.data.ranges;
        }
    }

    const history_command = <HistoryTask[TextCommand.TOGGLE_ITALICS]>{
        type: TextCommand.TOGGLE_ITALICS,
        redo_data: {
            ranges,
            type: ADD_ITALICS ? FormatType.ADD : FormatType.REMOVE
        },
        undo_data: {
            ranges,
            type: ADD_ITALICS ? FormatType.REMOVE : FormatType.ADD
        },
    };

    redoToggleItalics(history_command.redo_data, edit_host);

    addOperation(history_command, edit_host);
};

function redoToggleItalics(
    redo_data: HistoryTask[TextCommand.TOGGLE_ITALICS]["redo_data"],
    edit_host: EditHost
) {
    updateMetrics(edit_host);

    const { type, ranges } = redo_data;

    const italics: ItalicSection[] = [];


    const ADD_ITALICS = type == FormatType.ADD;

    for (const { start_offset, end_offset } of ranges) {

        modifySections(edit_host.root, start_offset, end_offset, {
            on_text_segment(s, start, len, mf) {

                const { length } = s;

                if (ADD_ITALICS) {
                    //Wrap the section in italics

                    const italic = new ItalicSection([]);

                    if (start > 0)
                        s = s.split(start);

                    if ((start + len) < length) {
                        s.split(len);
                        italic.link(s);
                        s.link(null, italic);
                    } else {
                        italic.link(s);
                        s.link(null, italic);
                    }

                    italics.push(italic);
                }
            },
            on_section_segment: (sec, start, end, mf) => {
                if (ADD_ITALICS) {
                    if (sec instanceof ItalicSection) {
                        //Do nothing
                    } else if (CAN_WRAP_IN_ITALIC(sec)) {
                        //Split the section and wrap it into the Italics section
                    } else if (CAN_FORMAT(sec)) {
                        modifySections(sec, start, end, mf);
                    }
                } else {
                    if (sec instanceof ItalicSection) {
                        const { head, tail } = sec;
                        if (head < end && tail > start) {
                            if (start <= head) {
                                if (tail <= end) {
                                    sec.dissolve();
                                } else {
                                    const r = sec.split(end - head);
                                    italics.push(r);
                                    sec.dissolve();
                                }
                            } else {
                                const split_point_left = start - head;
                                const r = sec.split(split_point_left);
                                italics.push(r);
                                if (tail <= end) {
                                    r.dissolve();
                                } else {
                                    const split_point_right = ((tail - head) - split_point_left) - (tail - end);
                                    r.split(split_point_right);
                                    r.dissolve();
                                }
                            }
                        }
                    } else {
                        modifySections(sec, start, end, mf);
                    }
                }
            },
            on_seg_overlap: (sec, start, end, mf) => {
                if (sec instanceof ItalicSection) {
                    if (!ADD_ITALICS)
                        sec.dissolve();
                } else if (ADD_ITALICS && CAN_WRAP_IN_ITALIC(sec)) {
                    const italic = new ItalicSection([]);
                    italic.link(sec);
                    sec.link(null, italic);
                    italics.push(italic);
                } else if (CAN_FORMAT(sec)) {
                    modifySections(sec, start, end, mf);
                }
            },
        });
    }

    for (const italic of italics)
        italic.heal();

    updateMetrics(edit_host, true);

    updateUIElements(edit_host);
}


function undoToggleItalics(
    undo_data: HistoryTask[TextCommand.TOGGLE_ITALICS]["undo_data"],
    edit_host: EditHost
) {
    redoToggleItalics(undo_data, edit_host);
}


registerTask("edit", TextCommand.TOGGLE_ITALICS, toggleItalics);
registerTask("undo", TextCommand.TOGGLE_ITALICS, undoToggleItalics);
registerTask("redo", TextCommand.TOGGLE_ITALICS, redoToggleItalics);
