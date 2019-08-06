import UID from "../../common/uid"
import { matchString /*, parseContainer*/ } from "./query/query_functions";
/*
    This Module is responsible for creating lookup and comparison tables for 
    the container syntax of the note system. Container syntax follows a classical
    direcotory structure form, where note is in a location denoted by /dir/dir/../note id.

    The return value of container is a key which represents the bucket | dir | container
    with which the server should store the note. This value is determined by criteria
    such as the number of containers, the number of notes per container, the uniquiness of a particalar
    notes container specifier. 
*/

function getContainerPortion(id_string, delimeter = "/") {
    const
        string = id_string.toString().trim(),
        val = (string[0] == delimeter ? string : delimeter + string).lastIndexOf(delimeter);

    return string.slice(0, val > -1 && val || 0);
}

function getNoteID(id_string, delimeter = "/") {
    const
        string = id_string.toString().trim();

    return string.slice(string.lastIndexOf(delimeter) + 1);
}

function getContainerArray(id_string, delimeter = "/") {
    return id_string.trim().split(delimeter);
}

function getOrCreateContainerEntry(container_entry, array, index = 1) {

    if (array.length == index)
        return container_entry;

    return getOrCreateContainerEntry(
        container_entry.getContainer(array[index]),
        array,
        index + 1
    );
}

class ContainerEntry {

    constructor(id = "", full_name = "") {
        this._ctr_ = null;
        this.id = id + "";
        this.full_name = `${full_name}${this.id}/`;
        this.uid = new UID;
    }

    getContainer(id) {
        if (this.containers.has(id))
            return this._ctr_.get(id);

        const val = new ContainerEntry(id, this.full_name);

        return (this._ctr_.set(id, val), val);
    }

    get containers() {
        if (!this._ctr_)
            this._ctr_ = new Map;
        return this._ctr_;
    }
}

function getAll(container, out = []) {
    for (const c of container.values()) {
        out.push(c.uid.string);
        getAll(c, out);
    }
    return out;
}

export default class Container {

    constructor(delimeter = "/") {
        this.root = new ContainerEntry();
    }

    /** Build Or Rebuild Container Index */
    build() {}

    change(old_id, new_id = "", delimeter = "/") {
        //No change on notes with same id
        if (old_id === new_id || !new_id)
            return this.get(old_id);

        if (!new_id)
            return { id: null, val: new_id };

        const { uid, val } = this.get(new_id, delimeter), { uid: old_uid_out, val: old_val } = this.get(old_id, delimeter);

        return { uid, val, old_val, old_uid_out };
    }

    getAll() {
        return getAll(this.root);
    }

    get(id, delimeter = "/") {
        if (id[0] !== delimeter)
            id = delimeter + id;

        const array = getContainerArray(getContainerPortion(id + "", delimeter + ""), delimeter + "");

        var { full_name: val, uid } = getOrCreateContainerEntry(this.root, array);

        return { uid, val };
    }

    query(container_query) {

        const out = [];

        parseContainer(container_query, this.root, out);

        return out;
    }

    getContainerID(id) {
        return getContainerPortion(id);
    }

    getNoteID(id) {
        return getNoteID(id);
    }
}

export function parseContainer(identifiers, ContainerEntry, output = [], idI = 1, FOLLOWING_WILD_CARD = false) {

    if (!identifiers || idI == identifiers.length) {

        if (FOLLOWING_WILD_CARD && ContainerEntry._ctr_)
            for (const ctr of ContainerEntry._ctr_.values())
                parseContainer(identifiers, ctr, output, idI, true)

        return output.push(ContainerEntry.uid);
    }

    var offset = 0;

    const
        identifier = identifiers[idI].ids,
        HAS_SUB_CONTAINERS = !!ContainerEntry._ctr_;

    if (identifier[0] == "*" && identifier.length == 1) {

        if (identifiers.length == idI + 1)
            output.push(ContainerEntry.uid);

        if (HAS_SUB_CONTAINERS)
            for (const ctr of ContainerEntry._ctr_.values())
                parseContainer(identifiers, ctr, output, idI + 1, true)

    } else if (HAS_SUB_CONTAINERS) {
        for (const ctnr of ContainerEntry._ctr_.values()) {

            const string = ctnr.id;

            if ((offset = matchString(identifier, string)) >= 0) {

                if (offset != string.length) continue;

                parseContainer(identifiers, ctnr, output, idI + 1)

                continue
            } else if (FOLLOWING_WILD_CARD)
                parseContainer(identifiers, ctnr, output, idI, true)
        }
    }
}
