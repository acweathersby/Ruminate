import UID from "../../common/uid";
import query_parser from "../../compiler/gnql";
import whind from "@candlefw/whind";
import fs from "fs";
import path from "path";

const fsp = fs.promises;
var log = "";
const writeError = e => log += e;

const warn = e => {};
//const warn = e=>console.trace(e);

/* Returns a Boolean value indicating whether the note's data matches the query */
function matchQuery(query_object, note) {
    switch (query_object.type) {
        case "AND":
            return matchQuery(query_object.left, note) && matchQuery(query_object.right, note)
        case "OR":
            return matchQuery(query_object.left, note) || matchQuery(query_object.right, note)
        case "MATCH":
            return note.query_data.includes(query_object.value);
    }
}

function Server(store, file_path = "") {
    let watcher = null,
        READ_BLOCK = false;
    /* Writes data to the stored file */
    async function write() {
        if (file_path) {

            const out = { data: [] };

            for (const note of store.values())
                out.data.push(note);
            //console.log("ASASDAD - write", file_path, JSON.stringify(out));

            READ_BLOCK = true
            try {
                await fsp.writeFile(file_path, JSON.stringify(out), "utf8")
            } catch (e) {
                writeError(e);
            }
            READ_BLOCK = false;
        }

        return false;
    }

    /* Read data from file into store */
    async function read(fp = file_path) {

        if (
            /*Prevent reading file that has just been updated from this server.*/
            READ_BLOCK ||
            !fp
        )
            return;

        let data = "",
            STATUS = false;

        await fsp.readFile(fp, "utf8")
            .then((d) => (STATUS = true, data = d))
            .catch(writeError)

        store = new Map();

        try {
            if (STATUS) {


                if (data) {
                    const json = JSON.parse(data);

                    if (json.data) {
                        for (const note of json.data)
                            if (note.uid)
                                store.set(note.uid, note);
                    }
                }

            }

            if (data)
                STATUS = updateDB(data)

        } catch (e) {
            writeError(e);
            STATUS = false;
        }

        return STATUS;
    }

    /* Updates store with data from json_String */
    function updateDB(json_data_string) {
        try {
            //  console.log("ASDAD", json_data_string)

            const json = JSON.parse(json_data_string);

            if (json.data)
                for (const note of json.data)
                    if (note.uid)
                        store.set(note.uid, note);
            return true;
        } catch (e) {
            writeError(e);
        }
        return false
    }

    return new(class Server {
        get type() {
            return "JSONDB"
        }

        /* 
        	Connects the server to the given json file. If file does not exist than an attempt is made to create it.
        	This will return false if the connection cannot be made
        	in cases were the file cannot be accessed, or the data
        	within the file cannot be parsed as JSON data. 
        	return true otherwise
        */
        async connect(json_file_path) {

            let result = false;

            const temp = path.resolve(process.env.PWD, json_file_path);

            if (await read(temp)) {
                file_path = temp;
                result = true;
            } else {
                try {
                    await fsp.writeFile(temp, "")
                    file_path = temp;
                    result = true;
                } catch (e) { writeError(e) }
            }
            if (result) {
                if (watcher)
                    watcher.close();

                watcher = fs.watch(file_path, { encoding: "utf8" }, (event, data) => {
                    if (event == "change")
                        read();
                })
            }
            return result;
        }

        /* Stores new note or updates existing note with new values */
        async storeNote(note) {

            var stored_note = null;

            const
                uid = note.uid.string,
                modifed_time = (Date.now() / 1000) | 0;

            if (store.has(uid))
                stored_note = store.get(uid);
            else
                stored_note = {
                    created: note.created
                }
            stored_note.modifed = modifed_time;
            stored_note.uid = uid;
            stored_note.body = note.body;
            stored_note.id = note.id;
            stored_note.tags = note.tags;
            stored_note.query_data = `${note.id.split(".").pop()} ${note.tags.join(";")} ${note.body}}`;


            store.set(uid, stored_note);

            await write();

            return true;
        }

        removeNote(uid) {}

        retrieveNote() {}

        async query(query) {

            await read(); //Hack - mack sure store is up to date;

            try {
                if (typeof query == "string" && query.length > 0)
                    query = query_parser(whind(query));
            } catch (e) {
                return [];
            }

            var container = "",
                id = "",
                query_object = query.query;

            if (query.container) 
                id = query.container.data.trim();

            const out = [];

            if (UID.stringIsUID(id))
                return [store.get(id)];

            if (Array.isArray(id)) {
                for (let item of id)
                    if (item = this.query(item))
                        out.push(...item);

                return out;
            }

            //Generate query engine and run against the data set.
            const temps = [];
            //Brute force search of ids
            if (id) {
                const parts = id.split(".");

                if(parts[parts.length-1].includes("*") && parts[parts.length-1] !=="*"){
                    parts.push("*");
                }

                for (const note of store.values()) {

                    const note_parts = note.id.split(".");

                    for (let i = 0; i < parts.length; i++) {
                        if (
                            i == parts.length - 1
                        ) {
                            if (
                                parts[i] == "*" || (
                                    i == note_parts.length - 1 &&
                                    (!parts[i] || parts[i] == note_parts[i])
                                )
                            ) {
                                temps.push(note);
                                break;
                            }
                        } else if (
                            note_parts[i] != parts[i] &&
                            !parts[i].includes("*") || 
                            !note_parts[i].includes(parts[i].split("*")[0])
                            ) {
                            break
                        }
                    }
                }
            }

            return query_object ?
                temps.filter(note => matchQuery(query_object, note)) :
                temps;
        }

        /* 
        	Deletes all data in store. 
        	Returns a function that returns a function that actually does the clearing.
        	Example server.implode()()();
        	This is deliberate to force dev to use this intentionally.
         */
        implode() {
            file_path && warn("Warning: Calling the return value can lead to bad things!");
            return () => (file_path && warn(`Calling this return value WILL delete ${file_path}`),
                async () => {
                    store = new Map();

                    try {
                        if (file_path)
                            await fsp.unlink(file_path).catch(e => {});
                    } catch (e) {

                    }

                    file_path = "";
                })
        }
    })
}

export default function() {
    if (new.target)
        return Server(new Map());
    return Server(new Map());
}
