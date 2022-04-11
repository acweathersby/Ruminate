import { convertMDASTToEditLines, parseMarkdownText } from '../editor/parser/parse_markdown';
import { MDNode, NodeType } from '../editor/task_processors/md_node';
import { heal, setChildren } from '../editor/task_processors/operators';
import { toMDString } from '../editor/text_editor';

const debug_store: Map<number, MockNote> = new Map();
let index_nonce = 0;
interface MockNote {
    name: string,
    text: string;
    id: number;
    paths: Set<string>;
}

function getMockNote(index: number): MockNote {
    if (debug_store.has(index))
        return debug_store.get(index);
    return createMockNote(index, undefined, true);
}

export function createMockNote(
    index: number = index_nonce,
    base_text: string = getPlaceHolderText(),
    ALLOW_OVERWRITE: boolean = false
): MockNote {

    if (!ALLOW_OVERWRITE)
        while (debug_store.has(index))
            index++;

    if (base_text) {


        const result = parseMarkdownText(base_text);

        const lines = convertMDASTToEditLines(result, 0);

        let root = new MDNode(NodeType.ROOT);

        root = setChildren(root, 0, ...lines);

        root = heal(root, 0).node;

        base_text = toMDString(root);
    }

    const mock_note: MockNote = {
        text: base_text,
        id: index,
        name: "",
        paths: new Set
    };

    debug_store.set(index, mock_note);

    index_nonce = Math.max(index + 1, index_nonce + 1);

    console.debug(`Created new note [${index}]`);

    return mock_note;
}

export function setNoteName(note_id: number, name: string) {
    const note = getMockNote(note_id);
    note.name = name;
    console.debug(`Set name of note [${note.id}] to "${name}"`);
}

export function getNoteName(note_id: number,): string {
    return getMockNote(note_id).name ?? "";
}

export function addNotePath(note_id: number, path: string): boolean {
    const note = getMockNote(note_id);
    note.paths.add(path);
    console.debug(`Added path of note [${note.id}] to "${path}"`);
    return true;
}

/**
 * Removes the note from the given path.
 * @param note_id 
 * @param path 
 * @returns 
 */
export function removeNotePath(note_id: number, path: string): boolean {
    const note = getMockNote(note_id);
    const result = note.paths.delete(path);
    if (result)
        console.debug(`Removed path of note [${note.id}] to "${path}"`);
    else
        console.debug(`Failed to remove path "${path}" from note [${note.id}]. Note does not belong to path.`);
    return result;
}

export function getNotePaths(note_id: number,): string[] {
    return getMockNote(note_id).path ?? "/";
}

export function getNotesFromContainer(path: string) {
    return Array.from(debug_store.values()).map(v => v.id);
}
export function getNotesFromQuery(query: string) {
    return [1];
}
export function insertText(note_id: number, offset: number, text: string) {


    const note = getMockNote(note_id);

    note.text = note.text.slice(0, offset)
        + text
        + note.text.slice(offset);
}

export function deleteText(note_id: number, offset: number, length: number) {

    const note = getMockNote(note_id);

    note.text = note.text.slice(0, offset) + note.text.slice(offset + length);
}

export function getRawDebugText(note_id: number): string {
    return getMockNote(note_id).text;
}
export function debugPrintNote(note_id: number, comment: string = '') {

    const { id, text } = getMockNote(note_id);

    console.debug(
        `note ${id} -----

${comment.split("\n").map(v => "# " + v).join("\n")}

===========================================
${text}
===========================================
`);

}

export function getText(note_id: number): string {
    return getMockNote(note_id).text;
}

function getPlaceHolderText() {
    const candidates = [/* `
# Introduction

I was writing some documentation for things and stuff, and thought to myself how nice it would be 
to have my own small app for that. Even though there are at least fifty of those open-sourced - 
for science is for science :) Anyway, this is how I imagine it would initially look like, as simple 
and readable as possible

## Coorporate

Me and a friend have just released the first version of a minimal markdown text editor website, FocusFox. 
Go check it out at www.focusfox.co and tell us what you think!
`, */ `
# What Is Ruminate Notes

Note taking is a journey. It is an expression of ideas and promise manifest in physical form. 
Ruminate aims to be a companion that provides you with the most useful tools for managing the 
state of notes and ideas from initiation to completion. 

## Planner

## Organizer

## Sticky Notes

## Prototyper

## Personal Database

## Text Editor

# What is this Markdown I keep hearing about?

Markdown is a text-to-HTML conversion tool for web writers. Markdown allows you to write 
using an easy-to-read, easy-to-write plain text format, then convert it to structurally valid XHTML (or HTML).

Thus, "Markdown" is two things: (1) a plain text formatting syntax; and (2) a software tool, written in Perl, 
that converts the plain text formatting to HTML. See the Syntax page for details pertaining to Markdown's 
formatting syntax. You can try it out, right now, using the online Dingus.

## Syntax

### Headers

Headers: \`##### h1 \`

#### Example

\`\`\`markdown
#### h1
\`\`\`
`];
    const index = Math.min(candidates.length - 1, Math.max(0, Math.floor((Math.random() * (candidates.length)))));
    return "";
    return candidates[index];

}

