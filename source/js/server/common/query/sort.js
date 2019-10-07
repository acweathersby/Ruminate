import { matchString, parseId } from "./query_functions.js";

function sortValue(value_op, value) {
    if (value_op)
        switch (value_op.type) {
            case "EQUALS_QUANTITATIVE":
            case "GREATERTHAN":
            case "LESSTHAN":
            case "RANGE":
                return parseFloat(value);
            case "DATE":
                return new Date(value).valueOf();
        }

    if (!isNaN(value))
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

function mergeSort(tuples, start, end, order, temp = tuples.slice()) {
    if (end - start < 2) return tuples;

    const middle = start + ((end - start) >> 1);

    mergeSort(tuples, start, middle, order, temp);
    mergeSort(tuples, middle, end, order, temp);

    let i = 0,
        t = start,
        left = start,
        right = middle;

    if (order > 0)
        while ((left < middle) && (right < end)) {
            if (tuples[left].v <= tuples[right].v)
                temp[t++] = tuples[left++];
            else
                temp[t++] = tuples[right++];
        }
    else
        while ((left < middle) && (right < end)) {
            if (tuples[left].v > tuples[right].v)
                temp[t++] = tuples[left++];
            else
                temp[t++] = tuples[right++];
        }

    for (i = left; i < middle; i++)
        temp[t++] = tuples[i];

    for (i = right; i < end; i++)
        temp[t++] = tuples[i];

    for(i = start; i < end;i++)
        tuples[i] = temp[i];
}

function quickSort(tuples, start, end, order) {
    if (end - start < 2) return tuples;

    // console.log(tuples.map(t=>t.i))

    const
        divide_item = tuples[start],
        divide_val = divide_item.v;

    let low = start;
    let high = end - 1;

    if (order > 0) {
        outer: while (1) {
            while (tuples[high].v >= divide_val) {
                high--;
                if (high <= low) {
                    tuples[low] = divide_item;
                    break outer;
                }
            }
            tuples[low] = tuples[high];
            low++;
            while (tuples[low].v < divide_val) {
                low++;
                if (low >= high) {
                    low = high;
                    tuples[low] = divide_item;
                    break outer;
                }
            }
            tuples[high] = tuples[low];
        }
    }
    else {
        outerb: while (1) {
            while (tuples[high].v <= divide_val) {
                high--;
                if (high <= low) {
                    tuples[low] = divide_item;
                    break outerb;
                }
            }
            tuples[low] = tuples[high];
            low++;
            while (tuples[low].v > divide_val) {
                low++;
                if (low >= high) {
                    low = high;
                    tuples[low] = divide_item;
                    break outerb;
                }
            }
            tuples[high] = tuples[low];
        }
    }

    quickSort(tuples, start, low, order);
    quickSort(tuples, low + 1, end, order);

    return tuples;
}

function insertionSort(tuples, start, end, order) {

    //console.log(order, start, end)
    if (order > 0) {
        //console.log("ADASD!!")
        for (let i = start; i < end; i++) {
            for (let j = start; j < i; j++) {
                if (tuples[j].v > tuples[i].v) {
                    const jv = tuples[i];

                    let e = i;

                    while (e >= j)
                        tuples[e--] = tuples[e]

                    tuples[j] = jv;

                    continue
                }
            }
        }
    } else {
        //console.log("ADASD", start, end)
        for (let i = start; i < end; i++) {
            for (let j = start; j < i; j++) {
                if (tuples[j].v < tuples[i].v) {
                    const jv = tuples[i];

                    let e = i;

                    while (e >= j)
                        tuples[e--] = tuples[e]

                    tuples[j] = jv;

                    continue
                }
            }
        }
    }
}

function jsSort(tuples, start, end, order) {
    if (order > 0) {
        tuples.sort((n1, n2) => n1.v < n2.v ? -1 : n1.v > n2.v ? 1 : 0);
    } else {
        tuples.sort((n1, n2) => n1.v < n2.v ? 1 : n1.v > n2.v ? -1 : 0);
    }
}

const sortAlgorithm = jsSort;

function sortProcessor(sort, notes, tuples = [], start = 0, end = notes.length, index = 0) {
    const sort_op = sort[index];

    if (tuples.length == 0)
        //Extract note values
        for (let i = start; i < end; i++)
            tuples.push({ v: getValue(sort_op, notes[i]), i })
    else {
        //console.log(start, end)
        for (let i = start; i < end; i++) {
            tuples[i].v = getValue(sort_op, notes[tuples[i].i]);
        }
    }
    const
        order = sort_op.order || -1;

    //console.log("SSSSSSSSSSSSSSSSSS",order, {start,end})

    //console.log(tuples)
    sortAlgorithm(tuples, start, end, order);

    if (index + 1 < sort.length) {
        //*/
        sortProcessor(sort, notes, tuples, start, end, index + 1);
        /*/ //*
        let
            old_value = null,
            last_index = 0;
        for (let i = 0; i < tuples.length; i++) {

            const val = tuples[i].v;

            if (old_value !== null && old_value != val) {

                if (i - last_index > 1)
                    sortProcessor(sort, notes, tuples, last_index, i, index + 1);

                last_index = i;
            }

            old_value = val;
        } //*/
    }

    return tuples
}

export default function sort(query_sort, notes) {
    const start = process.hrtime()
    //*/
    const tuples = sortProcessor(query_sort.reverse(), notes);
    /*/ //*
    const tuples = sortProcessor(query_sort, notes);
    //*/
    //console.log(process.hrtime(start)[1] / 1000000 + "ms")
    //console.log(tuples)
    return tuples.map(t => (notes[t.i]));
}
