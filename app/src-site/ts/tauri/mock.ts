import { convertMDASTToEditLines, parseMarkdownText } from '../editor/parser/parse_markdown';
import { MDNode, NodeType } from '../editor/task_processors/md_node';
import { heal, setChildren } from '../editor/task_processors/operators';
import { toMDString } from '../editor/text_editor';

const debug_store: Map<number, MockNote> = new Map();

interface MockNote {
    text: string;
    id: number;
}

function getMockNote(index: number): MockNote {
    if (debug_store.has(index))
        return debug_store.get(index);
    return createMockNote(index, undefined, true);
}

export function createMockNote(
    index: number = debug_store.size,
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

    return mock_note;
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
    return `
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
`;
}

