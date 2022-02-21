import { EditHost } from "../../types/edit_host";
import { TextCommand } from "../../types/text_command_types";
import { registerAction } from './register_action.js';

function toggleItalics(edit_host: EditHost) {
};
/* 
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
 */
registerAction("edit", TextCommand.TOGGLE_ITALICS, toggleItalics);
