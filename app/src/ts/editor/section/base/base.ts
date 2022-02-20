import { Section } from '../../types/types';


export class SectionBase {

    DIRTY: boolean;

    /**
     * The total number of Markdown characters represented by this section.
     */
    length: number;
    ele?: HTMLElement | Text;
    parent: Section | null;
    prev: Section | null;
    next: Section | null;
    first_child: Section | null;
    last_child: Section | null;

    head: number;

    tail: number;

    static get class_name(): string {
        return "section-ele";
    }

    constructor() {
        this.length = 0;
        this.ele = null;
        this.DIRTY = false;
        this.parent = null;
        this.prev = null;
        this.next = null;
        this.first_child = null;
        this.last_child = null;
        this.head = 0;
        this.tail = 0;
    }

    get Type(): any { return SectionBase; }

    toElement(host_element?: HTMLElement): Section {

        this.ele = document.createElement("div");
        this.ele.innerText = "[SECTION BASE]";

        if (host_element)
            host_element.appendChild(this.ele);

        return this.next;
    }

    createElement(tag: string): HTMLElement {
        const ele = document.createElement(tag);
        //@ts-ignore
        ele.ruminate_host = this;

        ele.classList.add(SectionBase.class_name);

        this.ele = ele;
        return ele;
    }


    updateMetrics(offset = 0) {

        this.head = offset;

        if (this.first_child) {
            for (const child of this.first_child.traverse_horizontal()) {
                offset = child.updateMetrics(offset);
            }
        }

        this.tail = offset;

        return offset;
    }
    /**
     * Split the section in two, return a new section that is immediately
     * right adjacent to this section
     * @returns
     */
    split(offset: number): Section {
        const obj = new this.constructor.prototype();
        obj.link(this);
        return obj;
    }


    createText(): Text {
        if (this.ele)
            return <Text>this.ele;
        const ele = new Text;
        //@ts-ignore
        ele.ruminate_host = this;
        this.ele = ele;
        return ele;
    }

    heal() { }

    /**
     * Remove the section from its list if it belongs to
     * one.
     */
    remove() {

        if (this.prev)
            this.prev.next = this.next;

        if (this.next)
            this.next.prev = this.prev;

        if (this.parent) {
            if (this.parent.first_child == this)
                this.parent.first_child = this.next;
            if (this.parent.last_child == this)
                this.parent.last_child = this.prev;
        }

        this.next = null;
        this.prev = null;
    }
    /**
     * Link this node into a parent section chain
     *
     *
     * @param {Section|null} prev - An existing node in the target parents chain that
     *  this node should follow. If this is `null` then this node will
     *  be inserted at the head of the chain.
     *
     * @param {Section} target_parent - A Section that can accept sub-sections.
     *
     */
    link(prev: Section | null, target_parent: Section = null) {
        if (!target_parent) {
            if (prev)
                target_parent = prev.parent;

            else
                throw new Error("Missing parent section to link");
        }

        if (this.parent) {
            if (!this.prev)
                this.parent.first_child = this.next;
            if (!this.next)
                this.parent.last_child = this.prev;
        }

        if (this.prev) {
            if (prev == this.prev)
                return;
            this.prev.next = this.next;
        }

        if (this.next)
            this.next.prev = this.prev;

        this.prev = null;
        this.next = null;

        this.parent = target_parent;

        if (!prev) {
            const next = target_parent.first_child;

            if (next) {
                next.prev = this;
            } else {
                target_parent.last_child = this;
            }

            this.next = next;

            target_parent.first_child = this;

        } else {

            this.prev = prev;

            this.next = prev.next;

            if (prev.next) {
                prev.next.prev = this;
            } else {
                this.parent.last_child = this;
            }

            prev.next = this;
        }

        return this;
    }

    get index(): number {
        if (this.prev) {
            return this.prev.index + 1;
        } else {
            return 0;
        }
    }

    get leading_offset() {
        return 0;
    }

    get children() {
        if (!this.first_child)
            return [];
        return [...this.first_child.#traverse_horizontal()];
    }

    *#traverse_horizontal(): Generator<Section> {
        let next = this.next;
        yield this;
        let node = next;
        while (node && node != this) {
            next = node.next;
            yield node;
            node = next;
        }
    }

    /**
     * Returns a generator that yields this node and its siblings. Preserves
     * current ordering and linkage even if modified during iteration.
     *
     */
    *traverse_horizontal(LOOP: boolean = false): Generator<Section> {
        let next = this.next;
        let parent = this.parent;
        if (parent) {

            const curr_idx = this.index;
            const children = parent.children;
            const length = children.length;

            yield this;

            for (let i = (curr_idx + 1) % length; i != curr_idx; i = (i + 1) % length) {
                if (i == 0 && !LOOP)
                    // Either `this` is at index 0 and it has already been yield,
                    // we have just looped to the start of the array as a result
                    // of the modulus operation.
                    break;

                yield children[i];
            }

        } return this.#traverse_horizontal();

    }

    hasSingleChild(): boolean {
        return this.last_child !== null && this.last_child == this.first_child;
    }

    numberOfChildren(): number {
        if (this.first_child)
            return this.children.length;
        return 0;
    }

    updateLength(): number {
        return this.length;
    }

    get markdown_length() {
        return this.length;
    }

    /**
     * Returns `true` if the givin offset is within the bounds of
     * node. If the node is zero length, then returns `true` if
     * the offset is equal to the node's offset.
     */
    overlaps(offset: number) {
        return this.head <= offset && this.tail >= offset;
    }
}
