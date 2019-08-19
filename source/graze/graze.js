#! /bin/bash

":" //# comment; exec /usr/bin/bash node --experimental-modules "$0" "$@"

/***
	((ruminate/docs/ruminate/introduction?#index=1))[upload]
	
	Graze - NodeJS Dynamic insertion of Ruminate Notes.

	Action - Upload, Query, Download. 

	Graze connects to a ruminatenotes server and is able to download, upload, an query note information based on text query fields within a text document

	Output - File, Buffer 

	Graze operates on text documents and is able to scan the document ruminatenote junctions and operate on that section of the document based on the actions described within the junction.

	Such actions include, import date from a Ruminate notes server, uploading data to a Ruminate notes server. 

	Need standard env variables for server configurations. 

***/
import whind from "@candlefw/whind";
import ruminateConstructor from "../ruminate.js";
import json from "../server/json/server.js";
import junction from "../compiler/junction.js";
import path from "path";
import fs from "fs";

const
	fsp = fs.promises,
	server = new json,
	ruminate = new ruminateConstructor({ server, sync_rate: 1000 });

/* Actions, open file and scan for junctions. Perform actions based on junction information */
(async function() {
	await server.connect("./notes.json");

	const file = "./data/ruminate/getting_started.md";

	var
		meta = null,
		file_date = 0,
		data = null,
		junctions = null;

	try {
		meta = await fsp.lstat(file);
		data = await fsp.readFile(file, "utf8");
	} catch (e) {
		console.warn(e);
		return;
	}

	const
		lex = whind(data);

	try {
		file_date = Math.round(meta.mtimeMs);
		junctions = junction(lex);
	} catch (e) {
		console.warn(e);
		return;
	}

	for (const junction of junctions) {
		if (typeof junction == "string") continue;
		if (junction.type = "JUNCTION") {

			if (!junction.action_block)
				continue;

			let [action, start = "", end = ""] = junction.action_block;

			start = start.trim();
			end = end.trim();

			//Only work with junctions that define a query for notes. 
			if (!junction.query)
				continue;

			switch (action.trim()) {
				case "sync":
					//Try to aquire the note from the query
					const notes = await ruminate.retrieve(junction.query);

					if (notes.length > 1) {
						console.warn("Cannot apply `sync` action with a query that returns multiple notes. ");
						continue;
					}

					var [note] = notes, note_date;

					if (notes.length == 0) {
						//create new note.
						note = createNote(ruminate, junction.query);
						note_date = -1;
					} else {
						note_date = note.modified;
					}

					if (!note) {
						console.warn("Unable to create note that fulfills the query: ", stringifyQuery(junction.query));
						continue;
					}


					if (note_date > file_date) {
						//insert data into file. 
					} else {
						//extract data from input. 
						let
							start_slice = junction.text_end,
							end_slice = data.length;

						if (start) {
							if (start !== "all") {
								lex.tl = 0;
								lex.off = junction.text_end;
								lex.next();

								findMatchingString(lex, start);

								if (!end)
									end_slice = lex.off - start.length;
								else
									start_slice = lex.off + 1;
							}
						}

						if (end) {
							findNextMatch(lex, end);
							end_slice = lex.off - end.length;
						}

						note.body = data.slice(start_slice, end_slice);

						note.setTag("file", file)
					}
					break;
				case "upload":
					break;
				case "insert":
					break;
			}
		}
	}
})()

function findNextMatch(lex, string_array, index = 0) {

	if (index >= string_array.length)
		return true;

	if (lex.ch == string_array[index]) {
		lex.tl = 1;
		return findNextMatch(lex.next(), string_array, index + 1)
	}

	return false;
}

function findMatchingString(lex, string) {

	const string_array = string.split("");

	let result = false;

	while (!lex.END && !(result = findNextMatch(lex, string_array))) {
		lex.tl = 1;
		lex.next();
	}

	return result;
}

function createNote(ruminate, query) {
	const id = stringifyQuery(query);

	let tags = [];

	if (query.filter) {
		const filter = query.filter;
		if (filter.type == "TAG")
			tags.push(filter.id.ids.join("") + ":" + filter.val.val);
	}

	if (!id.includes("*") && id.slice(-1) !== "/") {
		return ruminate.createNote(id, tags.join(","), "");
	}

	return null;
}

//TODO - Move to query files. 
function stringifyQuery(query, { sort = false, filter = false } = {}) {
	let str = "";

	const { container } = query;
	//ID
	str += container.containers.map(c => c.ids.join("")).join("/") + "/" + (container.id ? container.id.ids.join("") : "");

	if (filter && query.filter)
	; //str += "?" + filter.map

	if (sort && query.sort)
	; //str += "|" + sort.map

	return str;
}
