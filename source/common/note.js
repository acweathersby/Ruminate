import whind from "@candlefw/whind";
import Observer from "@candlefw/observer";

import * as jsdiff from "diff";
import reducer from "../compiler/reduce_tree.js";
import UID from "./uid.js";
import crdt from "../cpp/crdt.asm.js";

import {
	RUMINATE_REFERENCE,
	RUMINATE_NOTE,
	RUMINATE_NOTE_SYNC,
	RUMINATE_NOTE_PREPARE_FOR_SERVER,
	RUMINATE_NOTE_SYNC_LIST,
	RUMINATE_NOTE_BODY,
	RUMINATE_NOTE_TAGS,
	RUMINATE_NOTE_NEED_UPDATE,
	RUMINATE_UPDATE_QUEUE_ALERT,
	RUMINATE_NOTE_UPDATE
} from "./symbols.js";

function CHANGED(note) {
	if (!note[RUMINATE_NOTE_NEED_UPDATE]) {
		note[RUMINATE_NOTE_NEED_UPDATE] = true;
		note[RUMINATE_REFERENCE][RUMINATE_UPDATE_QUEUE_ALERT](note);
	}
}

function ProcessTags(tag_string_list) {
	if (!tag_string_list)
		return new Map;

	if (typeof tag_string_list == "string")
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

export default class Note {
	constructor(ruminate, uid, id, tags, body, refs, modified, NEED_SYNC = false) {
		this[RUMINATE_REFERENCE] = ruminate;
		this[RUMINATE_NOTE_SYNC_LIST] = [];
		this[RUMINATE_NOTE_NEED_UPDATE] = false;
		this[RUMINATE_NOTE_TAGS] = ProcessTags(tags);
		this[RUMINATE_NOTE_BODY] = {
			uid,
			id,
			modified,
			tags,
			body,
			refs
		}
		if (NEED_SYNC)
			CHANGED(this)
	}

	/****************** Basic Properties *************************/

	get created() { return this[RUMINATE_NOTE_BODY].uid.date_created.valueOf() }
	get createdDateObj() { return this[RUMINATE_NOTE_BODY].uid.date_created }
	get modified() { return this[RUMINATE_NOTE_BODY].modified }
	get uid() { return this[RUMINATE_NOTE_BODY].uid }
	get id() { return this[RUMINATE_NOTE_BODY].id }
	async delete(index, length) {}

	/****************** Synchronizing *************************/

	/*  
	    Returns a promise that is fulfilled the next time 
	    Graze syncs the note with the server
	*/
	sync() {
		return new Promise(res => this[RUMINATE_NOTE_NEED_UPDATE] ? this[RUMINATE_NOTE_SYNC_LIST].push(res) : res());
	}

	[RUMINATE_NOTE_UPDATE](note_data) {
		const note = this[RUMINATE_NOTE_BODY];

		if (note_data.modified < note.modified
			|| note_data.uid.toString() !== note.uid.toString())
			return;

		this[RUMINATE_NOTE_TAGS] = ProcessTags(note_data.tags);
		note.id = note_data.id;
		note.modified = note_data.modified;
		note.tags = note_data.tags;
		note.body = note_data.body;

		this.updateObservers()
	}

	// Called by ruminate after data has been sent to server and response has been received. 
	[RUMINATE_NOTE_SYNC](RESULT) {
		if (!RESULT) {
			CHANGED(this); // Prime for next update interval
		} else {
			this[RUMINATE_NOTE_SYNC_LIST].map(s => s(public_note))
			this[RUMINATE_NOTE_SYNC_LIST].length = 0;
		}
	}

	// Called by ruminate to process local data cache to send to server
	[RUMINATE_NOTE_PREPARE_FOR_SERVER]() {

		if (this[RUMINATE_NOTE_NEED_UPDATE]) {
			const list = [];

			for (const t of this[RUMINATE_NOTE_TAGS].entries())
				list.push(`${t[1].d?"!":""}${t[0]}${t[1].v?":"+t[1].v:""}`)

			this[RUMINATE_NOTE_BODY].tags = list;
			this[RUMINATE_NOTE_NEED_UPDATE] = false;
		}

		return this[RUMINATE_NOTE_BODY];
	}

	/****************** BODY *************************/

	get body() {
		return this[RUMINATE_NOTE_BODY].body;
	}

	set body(str) {
		const note = this[RUMINATE_NOTE_BODY];

		let modstr = note.body,
			NEED_SYNC_UPDATE_LOCAL = false,
			offset = 0;

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
			CHANGED(this);
		}
	}

	/****************** TAGS *************************/

	removeTag(name) {

		CHANGED(this);

		name = name.toString().toLowerCase();

		if (this[RUMINATE_NOTE_TAGS].has(name))
			this[RUMINATE_NOTE_TAGS].get(name).d = true;

		return true;
	}

	setTag(name, value) {
		if (!name && !value)
			return;

		if (typeof(name) == "object") {
			value = name.value;
			name = name.name + "";
		} else if (value === null)
			value = undefined;

		name = name.toString().toLowerCase();

		this[RUMINATE_NOTE_TAGS].set(name, { v: value, d: false });

		CHANGED(this);

		return true;
	}

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
	}

	getTag(name) {
		name = name.toString().toLowerCase();
		const tag = this[RUMINATE_NOTE_TAGS].get(name);
		return (tag && !tag.d) ? tag.v ? tag.v : name : null;
	}

	getTags() {
		return [...this[RUMINATE_NOTE_TAGS].keys()]
			.map((name, v) => (v = this.getTag(name), v ? v == name ? { name } : { name, value: v } : null))
			.filter(e => e !== null);
	}

	get tag() {
		return new Proxy(this, {
			get: (obj, prop) => this.getTag(prop),
			set: (obj, prop, value) => {
				if (value === null)
					this.removeTag(prop);
				return this.setTag(prop, value)
			}
		})
	}

	set tag(e) {}

	get tags() {
		return this.getTags();
	}

	set tags(v) {
		this.setTags(v);
	}


	/********************* Rendering ****************************/

	// render the note's message data into a string output
	async render(handler, set = new Set) {
		const 
			note = this[RUMINATE_NOTE_BODY],
			ruminate = this[RUMINATE_REFERENCE];

		if (handler) {
			return handler("string", note.body);
			for (const value of reducer(whind(note.body))) {
				if (typeof value == "string")
					await handler("string", value);
				else {
					const notes = await ruminate.retrieve(value.value)
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
					for (const note of await ruminate.retrieve(value.value)) {

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

Observer("update", Note.prototype);
