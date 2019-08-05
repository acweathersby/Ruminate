import query_parser from "../../compiler/gnql";
import UID from "../../common/uid";
import whind from "@candlefw/whind";

export function matchString(strings, to_match_string, offset = 0, index = 0, FOLLOWING_WILD_CARD = (offset == 0)) {

    if (index == strings.length)
        return FOLLOWING_WILD_CARD ? to_match_string.length : offset;

    const string = strings[index];

    if (string == "*")
        return matchString(strings, to_match_string, offset, index + 1, true);
    else if (!string)
        return matchString(strings, to_match_string, offset, index + 1, FOLLOWING_WILD_CARD);
    else {

        const i = to_match_string.indexOf(string, offset);

        if (i >= 0 && (FOLLOWING_WILD_CARD || i == offset))
            return matchString(strings, to_match_string, i + string.length, index + 1)
    }

    return -1;
}

export function parseContainer(identifiers, parts, idI = 0, pI = 0) {

    if (!identifiers || idI == identifiers.length)
        return parts.length <= pI;

    const identifier = identifiers[idI].ids;

    var offset = 0;

    if (identifier[0] == "*" && identifier.length == 1) {

        if (identifiers.length == idI + 1)
            return true;

        for (var i = pI; i < parts.length; i++) {
            if (parseContainer(
                    identifiers,
                    parts,
                    idI + 1,
                    i
                ))
                return true;
        }
    } else if (parts.length == 0 || parts.length <= pI) {
        return false;
    } else if ((offset = matchString(identifier, parts[pI])) >= 0) {

        if (offset != parts[pI].length)
            return false;



        return parseContainer(identifiers, parts, idI + 1, pI + 1);
    }

    return false
}

export function parseId(identifier, string) {
    if (!identifier)
        return true;

    if (!string)
        return false;

    return matchString(identifier.ids, string) >= 0;
}

export function QueryEngine(
    server, 	// 
    container 	// Container Store For Container ID Lookup
    //serverLookupScript // Generated function script used to lookup info on backing store. 
) {
    
    function getTagPresence(note, ids) {

        for (let i = 0; i < note.tags.length; i++) {
        	
            if (matchString(ids, note.tags[i] + "") >= 0) {
                return true;
            }
        }

        return false;
    }

    function getTagNumericalValue(note, ids) {
        for (let i = 0; i < note.tags.length; i++) {
            if (matchString(ids, note.tags[i] + "") >= 0) {
                const val = note.tags[i].toString().split(":")[1]
                if (val) {
                    return parseFloat(val);
                } else {
                    return 1;
                }
            }
        }
        return 0;
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
                return getTagPresence(note, filter.tag.ids);
            case "TAGEQ": break;
        }
    }

    function sortQuery(results, sorting_parameters) {
        for (const sort of sorting_parameters) {
            switch (sort.type) {
                case "TAG":

                    const order = sort.order || -1;

                    results = results.sort((n1, n2) =>
                        getTagNumericalValue(n1, sort.tag.ids) < getTagNumericalValue(n2, sort.tag.ids) ? -1 * order : 1 * order
                    )

                    console.log(sort)
                    break;
            }
        }
        return results;
    }

    /** Get Containers Functions should return a list of notes that match the query.container property. **/
    if (!server.getNotesFromContainers)
        throw new Error("Server not implemented with getNotesFromContainers method. Cannot create Query Engine");

    const getNotesFromContainers = server.getNotesFromContainers.bind(server);


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
    return async function(query_string) {

        const query = query_parser(whind(query_string + ""));

        console.log(query)

        var results = await getNotesFromContainers(query.container);

        if (!results || results.length == 0)
            return [];

        if (query.filter)
            results = results.filter(note => filterQuery(query.filter, note));

        if (query.sort) {
            results = sortQuery(results, query.sort);
        }


        return results;
    }
}
