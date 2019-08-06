export default function() {

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
            case "TAGEQ":
                break;
        }
    }

    function sortQuery(results, sorting_parameters, index = 0) {

        const sort = sorting_parameters[index];
        const length = sorting_parameters.length;

        switch (sort.type) {
            case "TAG":

                const order = sort.order || -1;
                const id = sort.tag.ids;
                results = results.sort((n1, n2) =>
                    getTagNumericalValue(n1, id) < getTagNumericalValue(n2, id) ? -1 * order : 1 * order
                )

                if (index + 1 < length) {
                    //split up results and continue
                    let old_value = null;
                    let last_index = 0;

                    for (let i = 0; i < results.length; i++) {

                        let val = getTagNumericalValue(results[i], id);

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
}
