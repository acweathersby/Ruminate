import query_parser from "../../compiler/gnql";
import UID from "../../common/uid";
import worker from "./query_worker";
import whind from "@candlefw/whind";

import { matchString, parseId } from "./query_functions";
import { Worker } from "worker_threads";


export function QueryEngine(
    server, // Server functions that the query engine will use 
    CAN_USE_WORKER = false
) {


    function filterValue(value_op, value) {
        if (!value)
            return false;
        const val = value_op.val;
        switch (value_op.type) {
            case "EQUALS_QUALITATIVE":
                return matchString(val.ids, value) >= 0;
                break;
            case "EQUALS_QUANTITATIVE":
                return !isNaN(value) && (value == val);
                break;
            case "GREATERTHAN":
                value = parseFloat(value);
                return !isNaN(value) && (value < val);
                break;
            case "LESSTHAN":
                value = parseFloat(value);
                return !isNaN(value) && (value > val);
                break;
            case "RANGE":
                value = parseFloat(value);
                return !isNaN(value) && (value >= val[0] && value <= val[1]);
                break;
            case "DATE":

                value = new Date(value).valueOf();

                return !isNaN(value) && (
                    val.length > 1 ?
                    (value >= val && value <= val[1]) :
                    (value & val == value)
                );

                break;
        }
        return false;
    }

    function filterTag(note, tag_op) {

        const ids = tag_op.id.ids;

        for (let i = 0; i < note.tags.length; i++) {

            const tag = (note.tags[i] + "").split(":");

            if (matchString(ids, tag[0]) >= 0) {

                if (tag_op.val)
                    return filterValue(tag_op.val, tag[1]);

                return true;
            }
        }

        return false;
    }

    /* Returns a Boolean value indicating whether the note's data matches the query */
    function filterQuery(filter, note) {
        switch (filter.type) {
            case "AND":
                return filterQuery(filter.left, note) && filterQuery(filter.right, note)
            case "OR":
                return filterQuery(filter.left, note) || filterQuery(filter.right, note)
            case "MATCH":
                return matchString(filter.value.ids, note.query_data) >= 0;
            case "TAG":
                return filterTag(note, filter);
                break;
        }
    }


    function getTagValue(note, ids) {
        for (let i = 0; i < note.tags.length; i++) {
            if (matchString(ids, note.tags[i] + "") >= 0) {
                const val = note.tags[i].toString().split(":")[1]
                if (val)
                    return val;

                return "";

            }
        }
        return 0;
    }

    function getTagNumericalValue(note, ids) {
        for (let i = 0; i < note.tags.length; i++) {
            if (matchString(ids, note.tags[i] + "") >= 0) {
                const val = note.tags[i].toString().split(":")[1]
                if (val)
                    return parseFloat(val);
                return NaN;
            }
        }
        return 0;
    }

    function filterTag(note, tag_op) {

        const ids = tag_op.id.ids;

        for (let i = 0; i < note.tags.length; i++) {

            const tag = (note.tags[i] + "").split(":");

            if (matchString(ids, tag[0]) >= 0) {

                if (tag_op.val)
                    return filterValue(tag_op.val, tag[1]);

                return true;
            }
        }

        return false;
    }

    function sortQuery(results, sorting_parameters, index = 0) {

        const sort = sorting_parameters[index];
        const length = sorting_parameters.length;

        switch (sort.type) {
            case "TAG":


                const
                    order = sort.order || -1,
                    id = sort.id.ids;


                results = results
                    .map((note) => (note.temp_val = getTagNumericalValue(note, id), note))
                    .sort((n1, n2) => n1.temp_val < n2.temp_val ? -1 * order : 1 * order)

                if (index + 1 < length) {
                    //split up results and continue
                    //could use this to divy up sort jobs to workers.
                    let old_value = null,
                        last_index = 0;

                    for (let i = 0; i < results.length; i++) {

                        let val = results[i].temp_val;

                        if (old_value !== null && old_value != val) {
                            if (i - last_index > 1)
                                results.splice(last_index, i - last_index, ...sortQuery(results.slice(last_index, i), sorting_parameters, index + 1));
                            last_index = i;
                        }

                        old_value = val;
                    }
                }

                break;
        }

        return results;
    }


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

        if (UID.stringIsUID(query_string + ""))
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

        const uids = container.query(query.container.containers || default_container);

        for (const uid of uids)
            results.push(...await SERVER_getNotesFromContainer(uid));

        if (query.container && query.container.id) {

            const id = query.container.id;

            results = results.filter(note => parseId(id, container.getNoteID(note.id)))
        }

        if (!results || results.length == 0)
            return [];

        if (query.filter)
            results = results.filter(note => filterQuery(query.filter, note));

        if (query.sort)
            results = sortQuery(results, query.sort);

        return results;
    }
}
