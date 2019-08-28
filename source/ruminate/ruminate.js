#!/bin/sh 
":" //# comment; exec /usr/bin/env node --experimental-modules "$0" "$@"

/***
	((ruminate/docs/introduction))[upload]
	
	Ruminate - NodeJS Dynamic insertion of Graze Notes.

	Action - Upload, Query, Download. 

	Ruminate connects to a grazenotes server and is able to download, upload, an query note information based on text query fields within a text document

	Output - File, Buffer 

	Ruminate operats on text documents and is able to scan the document grazenote junctions and operate on that section of the document based on the actions described within the junction.

	Such actions include, import date from a graze notes server, uploading data to a graze notes server. 

	Need standard env variables for server configurations. 

***/
import whind from "@candlefw/whind";
import grazeConstructor from "../graze.js";
import json from "../server/json/server.js";
import reduce from "../compiler/reduce_tree.js";
import path from "path";
import fs from "fs";
const fsp = fs.promises;

const server = new json;

server.connect("./notes.json");

const g = new grazeConstructor({server, sync_rate:1000});

/* Actions, open file and scan for junctions. Perform actions based on junction information */
(async function(){
	const data = await fsp.readFile("./data/test/testruminate.txt", "utf8");

	const actions = reduce(whind(data));
	
	for(const action of actions){
		if(action.type == "REDUCE"){
			if(action.meta == "upload"){
				let note = (await g.retrieve(action.value))[0];
				if(!note){
					note = g.createNote(action.value, "", data);
				}else{
					note.body = data;
				}
			}
		}
	}
})()




