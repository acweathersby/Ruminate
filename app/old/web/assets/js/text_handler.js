import parser from "./formatting_parser.js";
import * as rm from "/pkg/ruminate_prototype.js";

const { parse } = await parser;

// Returns a list of inserts and deletions 
// that need to occur to allow the CRDT to 
// be correctly updated.

// Using near Verbatim Myers Difference Algorithm
// With O((N+M)D) complexity (Space and Time)

export function get_text_diffs(prev, next) {

    let D = 0;
    let M = prev.length;
    let N = next.length;

    const MAX = Math.max(0, M + N);

    let V = new Array(MAX * 2).fill(0);

    const VS = [];

    outer: while (D < MAX) {


        for (let k = -D; k <= D; k += 2) {
            let x = -1;
            if (k == -D || (k != D && V[MAX + (k - 1)] < V[MAX + (k + 1)])) {
                x = V[MAX + (k + 1)];
            } else {
                x = V[MAX + (k - 1)] + 1;
            }

            let y = x - k;

            while (x < M && y < N && prev[x] == next[y]) {
                x++;
                y++;
            }

            V[MAX + k] = x;

            if (x >= M && y >= N) {

                VS.push(V.slice());

                break outer;
            }
        }

        VS.push(V.slice());

        D++;
    }
    let x = M, y = N;
    let k = x - y;

    if (D == MAX)
        D--;

    let transitions = [[M, N]];

    for (let d = D; d >= 0; d--) {

        let V = VS[d];

        let end_point_x = V[MAX + k];
        let end_point_y = end_point_x - k;

        transitions.unshift([end_point_x, end_point_y]);

        let kp = 0;

        if (k == -d || (k != d && V[MAX + (k - 1)] < V[MAX + (k + 1)])) {
            kp = k + 1;
        } else {
            kp = k - 1;
        }

        k = kp;
    }

    transitions.unshift([0, 0]);

    let commands = [];

    let px = 0, py = 0;

    for (const [x, y] of transitions) {
        let pd = px - py;
        let d = x - y;
        let dd = d - pd;

        if (dd < 0) {
            commands.push([1, py, next[py]]);
        } else if (dd > 0) {
            commands.push([0, py, prev[px]]);
        }

        px = x;
        py = y;
    }

    return commands;
};

export function get_hierarchy_list(tag_get_tags) {

    const pairs = [];

    const tags = tag_get_tags();

    if (tags.length > 1) {

        for (let i = 0; i < tags.length; i += 2) {
            pairs.push([tags[i + 0], tags[i + 1]]);
        }
        //Find hierarchal tags
        const hierarchal_tags = pairs.filter(t => t[0].match(/.*[\\\/].*/g));

        // Split tags into hierarchal tree with each 
        // node representing a single tag (or no tag if a tag does not 
        // exists that has as it's final element the corresponding node 
        // name)

        const hierarchies = [];

        for (const [tag_list, id] of hierarchal_tags) {

            const bucket_names = tag_list.split(/[\\\/]/);
            const bucket_name = bucket_names.pop();

            if (bucket_names[0] == "")
                bucket_names.shift();

            let curr_buckets = hierarchies;

            for (const bucket_name of bucket_names) {

                let FOUND_BUCKET = false;

                for (let bucket of curr_buckets) {
                    if (bucket.name == bucket_name) {
                        FOUND_BUCKET = true;
                        curr_buckets = bucket.buckets;
                        break;
                    }
                }

                if (!FOUND_BUCKET) {
                    let new_curr_buckets = [];
                    curr_buckets.push({
                        name: bucket_name,
                        id: -1,
                        buckets: new_curr_buckets
                    });
                    curr_buckets = new_curr_buckets;
                }
            }

            let FOUND_BUCKET = false;

            for (let bucket of curr_buckets) {
                if (bucket.name == bucket_name) {
                    bucket.id = id;
                    FOUND_BUCKET = true;
                    break;
                }
            }

            if (!FOUND_BUCKET)
                curr_buckets.push({
                    name: bucket_name,
                    id: id,
                    tag: tag_list,
                    buckets: []
                });


        }

        return hierarchies;
    }

    return [];
}

/**
 * Represents an editable instance in a note's
 * edit tree. 
 */
export class EditNode {

    get data() {
        return this.nodes;
    }

    setParent(comp) {
        this.parent = comp;
        return this;
    }

    removeParent() {
        this.parent = null;
        return this;
    }

    subscribe(component) {
        //if (this.component)
        //    throw new ReferenceError("Only one component can be registered to an EditNode at a time");
        this.component = component;

        if (this.ele)
            this.ele.edit_node = null;

        this.ele = component.ele;

        this.ele.edit_node = this;

        component.onModelUpdate(this);

        return this;
    }

    unsubscribe(component) {
        if (component != this.component)
            throw new ReferenceError("Invalid attempt to unsubscribe from an EditNode without at first being subscribed");

        this.component = null;

        if (this.ele)
            this.ele.edit_node = null;

        this.ele = null;

        return this;
    }

    update() {
        if (this.component)
            this.component.onModelUpdate(this);
        return this;
    }

    toString() {
        return "EditNote-toString-return-placeholder";
    }

    click(e) {
        this.ele.setAttribute("contenteditable", true);
        console.log({ style });
    }

    set_indices() {
        let i = 0;
        for (const node of this.nodes)
            node.index = i++;
    }

    constructor(type, data = null, nodes = []) {
        this.self = this;
        this.OBSERVABLE = true;
        this.type = type;
        this.meta_data = data;
        this.component = null;
        this.ele = null;
        this.parent = null;
        this.index = -1;
        this.nodes = nodes.map(c => new ContentNode(...c).setParent(this));
        this.set_indices();
    }
}

export class RootNode extends EditNode {
    constructor(note_id, components) {
        super("root", { note_id });
        this.nodes = components.map(i => i.setParent(this));
    }

    subscribe(component) {

        super.subscribe(component);

        this.ele.setAttribute("contenteditable", true);

        this.ele.addEventListener("keydown", this.oninput.bind(this));

        this.ele.addEventListener("drop", this.ondrop.bind(this));

        //Drag-n-drop
        //Selection
    }

    oninput(e) {
        const selection = window.getSelection();

        console.log(e);

        if (selection.type == "Caret") {

            const { focusNode, focusOffset } = selection;

            const { edit_node } = focusNode.parentElement;

            if (!edit_node)
                throw Error("All text nodes should have an edit node!");

            if (e.code == "Enter") {
                edit_node.split(focusOffset);
                e.stopPropagation();
                e.preventDefault();
            } else if (e.code == "Backspace" && focusOffset == 0) {
                edit_node.join(focusOffset);
                e.stopPropagation();
                e.preventDefault();
            } else {
                //Schedule node to 
            }
        } else {

        }
    }

    ondrop(e) {
        e.stopPropagation();
        e.preventDefault();
    }
}

export class SectionNode extends EditNode {
    subscribe(e) {
        super.subscribe(e);
    }

    insertNode(child, new_data) {

        const new_node = new ContentNode(...new_data);

        new_node.setParent(this);

        const index = this.nodes.indexOf(child);

        this.nodes.splice(index + 1, 0, new_node);

        this.set_indices();

        this.update();
    }

    remove_node(child) {

    }

    merge_node_left(child) {
        if (child.index == 0) {

        } else {

        }
    }
}

export class ContentNode extends EditNode {
    constructor(...args) {
        super(...args);
        this.process_symbols();
        if (this?.meta_data?.text)
            this.text = this.meta_data.text;
        else this.text = " ";
    }

    process_symbols() {
        const nodes = this.nodes;
        const stack = [];
    }

    merge_left() {
        // Merge this node into the previous 
        // content node.
        this.parent.merge_node_left(this);
    }

    split(boundary) {
        const left = this.text.slice(0, boundary);
        const right = this.text.slice(boundary);
        this.text = left;
        this.parent.insertNode(this, ["text", { text: right }]);
        this.update();
    }
}

export class CodeLineNode { };
export class ItalicsNode { };
export class BoldNode { };
export class UnderlineNode { };

const env = {
    ContentNode,
    EditNode,
    SectionNode
};



export function construct_edit_tree(note_id) {

    const string = rm.get_text(note_id);

    const { err, result } = parse(
        string[0] == "\n"
            ? string
            : "\n" + string, env
    );

    if (err)
        throw err;

    console.log(result);

    return new RootNode(note_id, result[0]);
}