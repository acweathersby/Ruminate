import { Section } from '../types/types';

export function addChildrenStartingAt(parent: Section, child: Section) {
    let prev = null;
    for (const sec of child.traverse_horizontal()) {
        sec.link(prev, parent);
        prev = sec;
    }
}
