import { modifySections } from '../../task_processors/modify_sections.js';
import { Node } from './node.js';
import { TextSection } from '../text.js';


export class FormatNode extends Node {


    /**
    * Replaces itself with its children elements
    */
    dissolve() {
        if (this.parent) {
            let prev = this.prev;
            for (const child of this.children) {
                child.link(prev, this.parent);
                prev = child;
            }
            this.remove();
        }
    }

    /**
     * Joins adjacent ItalicSection together
     * and removes redundancies within the italic
     * section.
     *
     * Opposite of `split`.
     */
    heal() {

        const Type: typeof FormatNode = this.Type;

        if (this.prev instanceof FormatNode && this.prev instanceof Type) {
            this.prev.heal();
        } else {
            while (this.next) {
                if (this.next instanceof Type) {
                    let prev = this.last_child;
                    for (const child of this.next.children) {
                        child.link(prev, this);
                        prev = child;
                    }
                    this.tail = this.next.tail;
                    this.next.remove();
                } else
                    break;
            }
            //Remove Italic sections within the section
            modifySections(this, this.head, this.tail, {
                on_section_segment(s, start, end, mf) {
                    modifySections(s, start, end, mf);
                    if (s instanceof Type)
                        s.dissolve();
                    else if (s instanceof FormatNode)
                        s.heal();

                },
                on_seg_overlap(s, start, end, mf) {
                    modifySections(s, start, end, mf);
                    if (s instanceof Type)
                        s.dissolve();
                    else if (s instanceof FormatNode || s instanceof TextSection)
                        s.heal();
                },
                on_text_segment(s) {
                    s.heal();
                }
            });
        }
    }
}
