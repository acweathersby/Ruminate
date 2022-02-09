import { TextSection } from '../sections';
import { Section } from '../types/types';

interface ModifyFunctions {
    /**
     * Called when the selection range relates to the Text section in one of three ways:
     * - The selection range starts outside the section and ends within the section.
     * - The selection range starts within the section and ends outside the section.
     * - The selection range is entirely contained within the section and the range
     *   boundaries do not line up with section boundaries. 
     */
    on_text_segment: (s: TextSection, off: number, len: number, modify_functions: ModifyFunctions) => void;
    /**
     * Called when the selection range relates to the section in one of three ways:
     * - The selection range starts outside the section and ends within the section.
     * - The selection range starts within the section and ends outside the section.
     * - The selection range is entirely contained within the section and the range
     *   boundaries do not line up with section boundaries. 
     */
    on_section_segment: (s: Section, off_start: number, off_end: number, modify_functions: ModifyFunctions) => void;
    /**
     * Called when the givin selection is completely contained by the selection range.
     */
    on_seg_overlap: (s: Section, off_start: number, off_end: number, modify_functions: ModifyFunctions) => void;
}
const default_modify_functions: ModifyFunctions = {
    on_text_segment: (s, offs, offe, mf) => { },
    on_section_segment: (s, offs, offe, mf) => {
        modifySections(s, offs, offe, mf);
    },
    on_seg_overlap: (s, offs, offe, mf) => { }
};
export function modifySections(
    root_section: Section,
    range_start: number,
    range_end: number,
    modify_functions = default_modify_functions
) {
    const {
        on_text_segment = default_modify_functions.on_text_segment,
        on_section_segment = default_modify_functions.on_section_segment,
        on_seg_overlap = default_modify_functions.on_seg_overlap
    } = modify_functions;

    for (const section of root_section.children) {

        const { head, tail } = section;

        if (head < range_end && tail > range_start) {

            const
                /**
                 * Is a positive value or zero if the range start
                 * begins after or at the head of the section.
                 */
                range_start_rel = range_start - head,

                /**
                 * Is a positive value or zero if the range end
                 * begins before or at the tail of the section.
                 */
                range_end_rel = tail - range_end,
                /**
                 * The length of the region of text the section covers.
                 */
                length = tail - head;

            if (range_start_rel > 0) {
                // Start of range is within the section
                if (range_end_rel > 0) {
                    // The range is contained within the selection
                    if (section instanceof TextSection) {
                        on_text_segment(section, range_start_rel, length - range_end_rel - range_start_rel, modify_functions);
                    } else
                        on_section_segment(section, range_start, range_end, modify_functions);
                } else {
                    // The start of the range is within the section 
                    // but the end of is at or beyond the tail of the section.
                    // This is either a section or text segment
                    if (section instanceof TextSection) {
                        on_text_segment(section, range_start_rel, length - range_start_rel, modify_functions);
                    } else
                        on_section_segment(section, range_start, range_end, modify_functions);
                }
            } else if (range_start_rel == 0) {
                // Start of the range is at the head of the section.
                if (range_end_rel <= 0) {
                    //Range matches or exceeds the section boundaries
                    on_seg_overlap(section, range_start, range_end, modify_functions);
                } else if (range_end_rel > 0) {
                    //Range is within the section
                    if (section instanceof TextSection) {
                        on_text_segment(section, 0, length - range_end_rel, modify_functions);
                    } else
                        on_section_segment(section, range_start, range_end, modify_functions);
                }
            } else if (range_end_rel > 0) {
                //Range starts before section and ends within section
                if (section instanceof TextSection)
                    on_text_segment(section, 0, length - range_end_rel, modify_functions);
                else
                    on_section_segment(section, range_start, range_end, modify_functions);
            } else {
                on_seg_overlap(section, range_start, range_end, modify_functions);
            }
        }
    }
}