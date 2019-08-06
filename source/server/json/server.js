import UID from "../../common/uid";
import { QueryEngine } from "../common/query/query";
import { matchString, parseContainer, parseId } from "../common/query/query_functions";
import fs from "fs";
import path from "path";
import Container from "../common/container";

const fsp = fs.promises;
var log = "";

const writeError = e => log += e;
const warn = e => {};

function Server(delimeter = "/") {

    let watcher = null,
        file_path = "",
        READ_BLOCK = false;

    var
        uid_store = new Map,
        container_store = new Map,
        container = new Container;

    function getContainer(uid) {

        const id = uid + "";

        if (!container_store.has(id))
            container_store.set(id, new Map);

        return container_store.get(id);
    }

    /* Writes data to the stored file */
    async function write() {

        if (file_path) {

            const out = { data: [] };

            for (const note_store of container_store.values())
                for (const note of note_store.values())
                    out.data.push(note);

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
            .catch(writeError);
        // Create new storage systems.
        container_store = new Map;
        uid_store = new Map;
        container = new Container;

        try {
            if (STATUS) {

                if (data) {

                    const json = JSON.parse(data);

                    if (json.data)
                        for (const note of json.data) {
                            if (note.uid) {
                                getContainer(container.get(note.id).uid).set(note.uid, note);

                                uid_store.set(note.uid, note.id);
                            }
                        }
                }
            }

            if (data)
                STATUS = updateDB(data);

        } catch (e) {
            writeError(e);
            STATUS = false;
        }

        return STATUS;
    }


    /* Updates store with data from json_String */
    function updateDB(json_data_string) {
        try {

            const json = JSON.parse(json_data_string);

            if (json.data)
                for (const note of json.data)
                    if (note.uid)
                        container_store.set(note.uid, note);
            return true;
        } catch (e) {
            writeError(e);
        }
        return false
    }

    function noteFromID(uid) {

        const id = uid_store.get(uid + "");

        if (!id) return null;

        return getContainer(container.get(id, delimeter).uid).get(uid) || null;
    }

    const queryRunner = QueryEngine({
            getNotesFromContainer: container_uid => [...getContainer(container_uid).values()],
            getNoteFromUID: note_uid => noteFromID(note_uid)
        },
        false
    );

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

            if (uid_store.has(uid))
                stored_note = noteFromID(uid_store.get(uid));
            else
                stored_note = {
                    id: note.id,
                    created: note.created
                }

            const old_id = stored_note.id;

            stored_note.modifed = modifed_time;
            stored_note.uid = uid;
            stored_note.body = note.body;
            stored_note.id = note.id;
            stored_note.tags = note.tags;
            stored_note.query_data = `${note.id.split(".").pop()} ${note.tags.join(";")} ${note.body}`;

            uid_store.set(uid, note.id);

            getContainer(container.change(old_id, note.id, delimeter).uid).set(uid, stored_note);

            await write();

            return true;
        }

        removeNote(uid) {}

        async query(query_string) {
            await read(); //Hack - mack sure store is up to date;
            return await queryRunner(query_string, container)
        }

        /* 
            Deletes all data in container_store. 
            Returns a function that returns a function that actually does the clearing.
            Example server.implode()()();
            This is deliberate to force dev to use this intentionally.
         */
        implode() {
            file_path && warn("Warning: Calling the return value can lead to bad things!");
            return () => (file_path && warn(`Calling this return value WILL delete ${file_path}`),
                async () => {

                    container_store = new Map;
                    uid_store = new Map;
                    container = new Container;

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
    if (new.target);
    return Server();
}
