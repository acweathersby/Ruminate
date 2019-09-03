import { matchString, parseId, matchCRDTString } from "./query_functions.js";

function filterValue(value_op, value) {
	
	if(!value_op)
		return true;

    if (!value)
        return false;

    const val = value_op.val;
    
    switch (value_op.type) {
        case "EQUALS_QUALITATIVE":
            var v = matchString(val.ids, value) >= 0;
            return v
            break;
        case "EQUALS_QUANTITATIVE":
            value = parseFloat(value);
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
function filterProcessor(filter, note) {
    switch (filter.type) {
        case "NOT":
            return ! filterProcessor(filter.left, note)
        case "AND":
            return filterProcessor(filter.left, note) && filterProcessor(filter.right, note)
        case "OR":
            return filterProcessor(filter.left, note) || filterProcessor(filter.right, note)
        case "MATCH":
            note.string.reset();
            return matchCRDTString(filter.value.ids, note.string) >= 0;
        case "TAG":
            return filterTag(note, filter);
            break;
       case 'CREATED':
            return filterValue(filter.val, note.created);;
            break;
        case 'MODIFIED':
            return filterValue(filter.val, note.modified);;
            break;
        case 'SIZE':
            return filterValue(filter.val, note.body.length);;
            break;
    }
}

export default function filter(filter_op, notes){
 	return notes.filter(n=>filterProcessor(filter_op, n));
}
