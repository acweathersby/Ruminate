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

    split(offset: number) {

        let right = new this.Type([]);

        right.link(this);

        const head = this.head;

        right.tail = this.tail;

        this.tail = this.head + offset;

        right.head = this.tail;

        for (const child of this.children) {
            if ((child.tail - head) >= offset) {
                const child_right = (child.tail - head) == offset
                    ? child.next
                    : child.split((head + offset) - (child.head));
                if (child_right) {
                    let prev = null;
                    for (const child of child_right.traverse_horizontal()) {
                        child.link(prev, right);
                        prev = child;
                    }
                }
                break;
            }
        }

        return right;
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
