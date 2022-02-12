import { EditLine, ItalicSection } from '../section/sections';
import { Section } from '../types/types';
export function CAN_WRAP_IN_BOLD(section: Section): boolean {
    return !(section instanceof ItalicSection) && !(section instanceof EditLine);
}

export function CAN_WRAP_IN_ITALIC(section: Section): boolean {
    return !(section instanceof ItalicSection) && !(section instanceof EditLine);
}

export function CAN_FORMAT(section: Section): boolean {
    return true;
}
