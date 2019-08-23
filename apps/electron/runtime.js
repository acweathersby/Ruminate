const server = new ruminate_objects.server.json;
const codemirror = require("codemirror");
const jsdiff = require("diff");

server.connect("./notes.json");

const ruminate = new ruminate_objects.ruminate({ sync_rate: 2000, server });

const EPOCH_Date = wick.scheme.date;
const EPOCH_Time = wick.scheme.time;
const Longitude = wick.scheme.number;
const Latitude = wick.scheme.number;
const $Number = wick.scheme.number;
const $String = wick.scheme.string;
const $Boolean = wick.scheme.bool;
const markdom = ruminate_objects.client.markdom;
const TEXT_NODE_TYPE = 3;

function CodeMirrorBootStrapper(element) {
    codemirror(element);
}

function TraceOffset(root, start_node, start_offset) {

    if (root == start_node) return start_offset

    let
        total_offset = start_offset,
        node = start_node.previousSibling ? start_node.previousSibling : start_node.parentNode;

    if (node !== root) {

        if (node.nodeName == "#text") {
            total_offset += node.data.length;
        } else if (node !== start_node.parentNode) {
            switch (node.nodeName) {
                case "P":
                case "H1":
                case "H2":
                case "H3":
                case "H4":
                case "BR":
                    total_offset += node.innerText.length + 1;
                    break;
                default:
                    total_offset += node.innerText.length;

            }
        }

        total_offset = TraceOffset(root, node, total_offset);
    }


    return total_offset;
}

function GetOffset(root, offset){
    if(!root){
        return {node:null, offset}
    }

    const text = root.nodeType != TEXT_NODE_TYPE ? root.innerText : root.data;
    if(root.nodeName == "notes"){
        return GetOffset(root.nextSibling, offset);
    }

    if(offset > text.length){
        return GetOffset(root.nextSibling, offset - text.length);
    }else{
        
        if(root.nodeType == TEXT_NODE_TYPE || offset == 0){
            return {node:root, offset}
        };

        for(const child of root.childNodes){
            const text = child.nodeType != TEXT_NODE_TYPE ? child.innerText : child.data;
            if(offset > text.length)
                offset -= text.length;
            else{
                return GetOffset(child, offset);
            }
        }
    }

    debugger
}

function renderer(scope, note) {

    var parentElement,
        NEW_RUNNING = true,
        children = null,
        index = 0,
        length = 0;

    let cache = note.body;

    setInterval(function() {
        if (parentElement) {
            const selection = window.getSelection();

            if (selection.type !== "None" && selection.anchorNode) {

                let node = selection.anchorNode,
                    offset = selection.anchorOffset;

                if (node.nodeType !== TEXT_NODE_TYPE) {
                    node = node.children[offset]
                    offset = 0;
                }

                offset = TraceOffset(parentElement, node, [offset]);
            }


            const d = markdom.MDify(parentElement);
            note.body = d;
        }
    }, 2000)

    /** 
        This function is called by note.render and 
        recives either strings or array of notes
        as the body of the note is parsed by ruminate 
    **/
    async function render(type, obj, query) {


        if (NEW_RUNNING)
            children = parentElement.children, index = 0, length = children.length;
        switch (type) {
            case "string":
                //get diffs
                let offset = 0, original_pos = 45, pos = original_pos;

                for (const diff of jsdiff.diffChars(cache, obj)) {
                    if (diff.added) {
                        if(offset < pos){
                            pos += diff.count;
                        }
                        //offset += diff.count;
                    } else if (diff.removed) {
                        if(offset < pos){
                            pos -= diff.count;
                        }
                        offset -= diff.count;
                    }
                    offset += diff.count;
                    //insert into string
                }

                const vDOM = markdom.DOMify(obj);

                markdom.merge(parentElement, vDOM, (notequery, meta) => {
                    const note = document.createElement("notes");
                    ruminate.retrieve(notequery).then(async (notes) => {
                        if (notes.length > 0) {
                            const scope = await wick("./components/list.html", presets)
                                .pending
                                .then(comp => comp.mount(note, { notes }));
                        }
                    })
                    note.setAttribute("query", notequery);
                    note.setAttribute("meta", meta || "");
                    return note;
                })
                const p = GetOffset(parentElement, pos);

                if(p.node){
                    const selection = window.getSelection();
                    selection.removeAllRanges();

                    const range = document.createRange();

                    range.setStart(p.node, p.offset);
                    range.setEnd(p.node, p.offset);

                    selection.addRange(range)
                }

                console.log();

                break;
            case "complete":
                //Remove any extra children
                NEW_RUNNING = true;
                return;
        }


    }

    return {
        async update(p) {
            parentElement = p;
            await note.render(render);
            cache = note.body;
        }
    }
}


const presets = wick.presets({
    custom: { ruminate, cm: CodeMirrorBootStrapper, renderer },
    schemas: {}
})
//*

//ruminate.createNote("groceries/milk", "", "This is a reminder to get milk!");
//ruminate.createNote("groceries/butter", "", "This is a reminder to get butter!");
//ruminate.createNote("groceries/cream", "", "This is a reminder to get cream!");
//ruminate.createNote("signatures. main", "", "Anthony C Weathersby");
//ruminate.createNote("places to visit.", "", "I'd like to go to rome someday");
//*/
const n2 = ruminate.createNote("/test2", "",
    `# This is the markdown

I never really liked to **eat** too mutch
((groceries/*?milk))
> But theres always a I chance I could eat more.

`);
//*/
//n2.store().then(() => {})
window.addEventListener("load", () =>
    wick("./components/main.html", presets)
    .pending
    .then(comp => comp.mount(document.body))
    .then(scope => scope.update("mounted"))
)
