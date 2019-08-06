import { matchString, parseId } from "./query_functions";

function sortValue(value_op, value) {
    if(value_op)
        switch (value_op.type) {
            case "EQUALS_QUANTITATIVE":
            case "GREATERTHAN":
            case "LESSTHAN":
            case "RANGE":
                return  parseFloat(value);
            case "DATE":
                return new Date(value).valueOf();
        }

    if(!isNaN(value))
        return parseFloat(value);

    return value || true;
}

function sortTag(note, tag_op) {

    const ids = tag_op.id.ids;

    for (let i = 0; i < note.tags.length; i++) {

        const tag = (note.tags[i] + "").split(":");

        if (matchString(ids, tag[0]) >= 0) {

            return sortValue(tag_op.val, tag[1]);
        }
    }

    return false;
}

function getValue(sort_op, note) {
    switch (sort_op.type) {
        case 'TAG':
        	return sortTag(note, sort_op);
            break;
        case 'CREATED':
            return note.created;
            break;
        case 'MODIFIED':
            return note.modified;
            break;
        case 'SIZE':
            return note.body.length;
            break;
    }
}

function sortProcessor(sort, notes, tuples = [], start = 0, end = notes.length, index = 0){
	const sort_op = sort[0];
	
    if(tuples.length == 0)
		//Extract note values
        for(let i = start; i < end; i++)
            tuples.push({ v: getValue(sort_op, notes[i]), i })
    else 
    	for(let i = start; i < end; i++)
    		tuples[i].v = getValue(sort_op, notes[tuples[i].i]);
    
    const
    	order = sort_op.order || -1;
    console.log(tuples)

    tuples = tuples.sort((n1, n2) => n1.v < n2.v ? -1 * order : 1 * order);

    if(index +1 < sort.length){

    	let 
    		old_value = null,
        	last_index = 0;

	    for (let i = 0; i < tuples.length; i++) {

	        const val = tuples[i].v;

	        if (old_value !== null && old_value != val) {
	            
	            if (i - last_index > 1)
	            	sortProcessor(sort, notes, tuples, last_index, i, index+1);
	            
	            last_index = i;
	        }

	        old_value = val;
	    }
    }

	return tuples
}

export default function sort(query_sort, notes) {
    
    const tuples = sortProcessor(query_sort, notes);

    return tuples.map(t => (notes[t.i]));
}