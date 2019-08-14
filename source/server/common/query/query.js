import whind from "@candlefw/whind";

import query_parser from "../../../compiler/gnql";
import UID from "../../../common/uid";
import sort from "./sort.js";
import filter from "./filter.js";

import { parseId } from "./query_functions";
import { Worker } from "worker_threads";


export function QueryEngine(
    server, // Server functions that the query engine will use 
    CAN_USE_WORKER = false
) {

    /** Get Containers Functions should return a list of notes that match the query.container property. **/
    if (!server.getNotesFromContainer)
        throw new Error("Server not implemented with getNotesFromContainer method. Cannot create Query Engine");

    /** Get UID function should return a note indexed by the uid **/
    if (!server.getNoteFromUID)
        throw new Error("Server not implemented with getNoteFromUID method. Cannot create Query Engine");

    const
        SERVER_getNotesFromContainer = server.getNotesFromContainer.bind(server),
        SERVER_getNoteFromUID = server.getNoteFromUID.bind(server);

    const default_container = [{ ids: [""] }];

    /** ((new_note)(js_crawler.function))

    This function handles queries using thread primitives to split query 
    results over multiple threads to ensure maximum throughput.

    Queries occur in multiple passes. 
        - The first pass generates a list of note queriables that are comprised of 
            a. UID
            b. ID - TAG - BODY information
         
         These are selected based on the container portion of the query. i.e. ( => [container.container. id ] <= : ...)
         Multiple lists of this type can be generated based on strategies such as 
            - One MOAL (Mother of all lists), later split into equal parts
            - One list per container
            - Round Robin placement of lists generate per container into buckets
         These strategies can allow container group lookup to be distributed between computing units

        - Once a set of lists are generated, they are distributed to individual computing units to handle the second query action
        Each note is matched against the second query portion (... : =>[...]<=), and winning items are placed in output lists.

        Once all inputs have been processed, items are sorted based on the query criteria, or based on modified date. Results with duplicate UIDs are removed. 

        A list of UIDs are passed back to the client. The client can decide to query the server for the actual note contents, or do something else with the UID information.
    */

    return async function runQuery(query_string, container) {

        var results = [];

        if (!query_string)
            return results;

        if (UID.isUID(query_string + ""))
            return [SERVER_getNoteFromUID(query_string)];

        if (Array.isArray(query_string)) {
            for (const item of query_string)
                results = results.concat(await runQuery(item));
            return results;
        }

        /************************************* UTILIZING QUERY SYNTAX *********************************************/
        var query;
        try {
            query = query_parser(whind(query_string + ""));
        } catch (e) {
            console.error(e)
            return [];
        }

        const uids = container.query(query.container ? query.container.containers : default_container);

        for (const uid of uids)
            results.push(...await SERVER_getNotesFromContainer(uid));

        if (query.container && query.container.id) {

            const id = query.container.id;

            results = results.filter(note => parseId(id, container.getNoteID(note.id)))
        }

        if (!results || results.length == 0)
            return [];

        if (query.filter)
            results = filter(query.filter, results);

        if (query.sort)
            results = sort(query.sort, results);

        return results;
    }
}
