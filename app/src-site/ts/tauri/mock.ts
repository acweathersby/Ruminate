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
    path: string;
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

    const result = parseMarkdownText(base_text);

    const lines = convertMDASTToEditLines(result, 0);

    let root = new MDNode(NodeType.ROOT);

    root = setChildren(root, 0, ...lines);

    root = heal(root, 0).node;

    const mock_note: MockNote = {
        text: toMDString(root),
        id: index
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

export function setNotePath(note_id: number, path: string) {
    const note = getMockNote(note_id);
    note.path = path;
    console.debug(`Set path of note [${note.id}] to "${path}"`);
}

export function getNotePath(note_id: number,): string {
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
    const candidates = [`
# Introduction

I was writing some documentation for things and stuff, and thought to myself how nice it would be 
to have my own small app for that. Even though there are at least fifty of those open-sourced - 
for science is for science :) Anyway, this is how I imagine it would initially look like, as simple 
and readable as possible

## Coorporate

Me and a friend have just released the first version of a minimal markdown text editor website, FocusFox. 
Go check it out at www.focusfox.co and tell us what you think!
`, `
# Header 1

## Header 2 

### Header 3

#### Header 4

##### Header 5

###### Header 6

Pa__ragraph__ 1: "*Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor 
incididunt ut labore et dolore magna aliqua.* __Ut enim ad minim veniam__, quis nostrud exercitation 
ullamco laboris nisi ut aliquip ex ea commodo consequat..."

\`\`\`javascript

console.log("hello world")

\`\`\`

Paragraph 2: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut 
labore et dolore magna aliqua..."

- Unordered 1

- Unordered 2

> Quote: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut

\`\`\`c++
int main(char ** argv, int argc){
    std::cout << "Hello World" << std::endl;
}
\`\`\`

Then End!

Do da do

Mi da do
`];
    const index = Math.floor((Math.random() * (candidates.length)));
    console.log({ index });
    return candidates[index];
}

