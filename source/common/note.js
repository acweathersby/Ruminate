import * as jsdiff from "diff";
import whind from "@candlefw/whind";

import reducer from "../compiler/reduce_tree";
import UID from "./uid";
import crdt from "../cpp/crdt.asm.js";
import { GRAZE_NOTE, GRAZE_UPDATE_QUEUE_ALERT, GRAZE_NOTE_UPDATE } from "./symbols.js";


function ProcessTags(tag_string_list) {
    if(!tag_string_list)
        return new Map;
    
    if(typeof tag_string_list == "string")
        tag_string_list = tag_string_list.split(",");

    return new Map(tag_string_list.map((t, p, tag) => (
        p = typeof t == "string" ? t.split(":") : [t + ""],
        tag = { v: undefined, d: false },
        tag.v = (p.length > 1)
        ? isNaN(p[1])
        ? p[1].trim()
        : parseFloat(p[1].trim())
        : undefined,
        [p[0].trim().toLowerCase(), tag]
    )));
}

export default function Note(graze, uid, id, tags, body, refs, modified, NEED_SYNC = false) {

    var NEED_SYNC_UPDATE = false;

    var pending_syncs = [];

    var tags_ = ProcessTags(tags);

    let note = {
        uid,
        id,
        modified,
        tags,
        body,
        refs
    }

    const store = async () => (await graze.store(note)) > 0;

    //Builds a tag list to send to the server
    function buildTagList() {
        const list = [];

        for (const t of tags_.entries())
            list.push(`${t[1].d?"!":""}${t[0]}${t[1].v?":"+t[1].v:""}`)

        return list;
    }

    function processNoteForServer() {
        note.tags = buildTagList();
    }

    function getNote() {

        if (NEED_SYNC_UPDATE) {
            processNoteForServer();
            NEED_SYNC_UPDATE = false;
        }

        return note;
    }

    function sync(RESULT) {
        if (!RESULT) {
            CHANGED(); // Prime for next update interval
        } else {
            pending_syncs.map(s => s(public_note))
            pending_syncs.length = 0;
        }
    }

    function CHANGED() {
        if (!NEED_SYNC_UPDATE) {
            NEED_SYNC_UPDATE = true;
            graze[GRAZE_UPDATE_QUEUE_ALERT](({ getNote, sync }))
        }
    }

    if (NEED_SYNC)
        (NEED_SYNC_UPDATE = false, CHANGED());

    const public_note = {
        /****************** Graze Private Functions / Properties ********************/

        //update this note with note data from server. If modified time of the note_data
        //is less than the current note then ignore. 
        [GRAZE_NOTE_UPDATE](note_data) {

            if (note_data.modified < note.modified
                || note_data.uid.toString() !== note.uid.toString())
                return;

            tags_ = ProcessTags(tags);

            note.id = note_data.id;
            note.modified = note_data.modified;
            note.tags = note_data.tags;
            note.body = note_data.body;

            //update observers.
        },

        get [GRAZE_NOTE]() { return ({ getNote, NEED_SYNC_UPDATE, sync }) },


        /****************** Basic Properties *************************/

        get created() { return note.uid.date_created.valueOf() },
        get createdDateObj() { return note.uid.date_created },
        get modified() { return note.modified },
        get uid() { return uid },
        get id() { return note.id },

        //***************** Synchronizing *************** 


        /*  
            Returns a promise that is fulfilled the next time 
            Graze syncs the note with the server
        */
        sync() {
            return new Promise(res => NEED_SYNC_UPDATE ? syncs.push(res) : res());
        },

        //***************** TAGS ************************

        removeTag(name) {

            CHANGED();

            name = name.toString().toLowerCase();

            if (tags_.has(name))
                tags_.get(name).d = true;

            return true;
        },

        setTag(name, value) {
            if (!name && !value)
                return;

            if (typeof(name) == "object") {
                value = name.value;
                name = name.name + "";
            } else if (value === null)
                value = undefined;

            name = name.toString().toLowerCase();

            tags_.set(name, { v: value, d: false });

            CHANGED();

            return true;
        },

        setTags(...v) {
            // Remove existing tags to make sure the expected result
            // of all tags now comprising of values defined in 
            // the set v.

            this.tags.map(t => this.delete(t.name));

            if (v) {
                if (Array.isArray(v))
                    for (const tag_set of v) {
                        if (Array.isArray(tag_set)) {
                            for (const tag of v)
                                setTag(name, value)
                            this.setTag(tag.name, tag.value);
                        } else if (typeof tag_set == "object")
                            this.setTag(tag_set.name, tag_set.value)
                    }
                else
                    this.setTag(v.name, v.value)
            }

            return true;
        },

        getTag(name) {
            name = name.toString().toLowerCase();
            const tag = tags_.get(name);
            return (tag && !tag.d) ? tag.v ? tag.v : name : null;
        },

        getTags() {
            return [...tags_.keys()]
                .map((name, v) => (v = this.getTag(name), v ? v == name ? { name } : { name, value: v } : null))
                .filter(e => e !== null);
        },

        get tag() {
            return new Proxy(this, {
                get: (obj, prop) => this.getTag(prop),
                set: (obj, prop, value) => {
                    if (value === null)
                        this.removeTag(prop);
                    return this.setTag(prop, value)
                }
            })
        },

        set tag(e) {},

        get tags() {
            return this.getTags();
        },

        set tags(v) {
            this.setTags(v);
        },


        //***************** BODY ************************

        get body() { return note.body },

        set body(str) {
            let modstr = note.body,
                NEED_SYNC_UPDATE_LOCAL = false;
            let offset = 0;

            //Get Minimum changes to note
            for (const diff of jsdiff.diffChars(note.body, str)) {
                if (diff.added) {
                    modstr = modstr.slice(0, offset) + diff.value + modstr.slice(offset);
                    NEED_SYNC_UPDATE_LOCAL = true;
                } else if (diff.removed) {
                    modstr = modstr.slice(0, offset) + modstr.slice(offset + diff.count);
                    NEED_SYNC_UPDATE_LOCAL = true;
                    offset -= diff.count;
                }
                offset += diff.count;
                //insert into string
            }

            //update store with new note changes. 
            if (NEED_SYNC_UPDATE_LOCAL) {
                note.body = modstr;
                CHANGED();
            }

        },

        async delete(index, length) {},
        //set meta(str) { note.tags = str },
        // saves the note's data to the backing server. returns true if the save was successfull, or returns false.

        // render the note's message data into a string output
        render: async function(handler, set = new Set) {
            if (handler) {
                for (const value of reducer(whind(note.body))) {
                    if (typeof value == "string")
                        await handler("string", value);
                    else {
                        const notes = await graze.retrieve(value.value)
                        await handler("notes", notes, value);
                    }
                }
                handler("complete");
            } else {

                if (!set.has(this.uid.string))
                    set.add(this.uid.string)

                var strings = [];



                for (const value of reducer(whind(note.body))) {
                    if (typeof value == "string")
                        strings.push(value);
                    else {
                        for (const note of await graze.retrieve(value.value)) {

                            if (set.has(note.uid.string))
                                continue;

                            if (note)
                                strings.push(await note.render(handler, new Set(set)));
                        }
                    }
                }
                return strings.join("");
            }
        }
    }

    return public_note;
}
