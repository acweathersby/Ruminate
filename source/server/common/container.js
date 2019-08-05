import UID from "../../common/uid"

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
    const val = id_string.trim().lastIndexOf(delimeter)
    return id_string.trim().slice(0, val > -1 && val || 0);
}

function getContainerArray(id_string, delimeter = "/") {
    return (id_string.trim()[0] == delimeter ? id_string.trim().slice(1) : id_string.trim()).split(delimeter);
}

function getOrCreateContainerEntry(container_entry, array, index = 0) {

    if (array.length == index)
        return container_entry;

    return getOrCreateContainerEntry(
        container_entry.getContainer(array[index]),
        array,
        index+1
    );
}

class ContainerEntry {

    constructor(id, full_name = "/") {
        this._ctr_ = null;
        this.id = id + "";
        this.full_name = `${full_name}${this.id}`
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

/** THIS IS THE KLUDGE VERSION! **/

export default class Container {

    constructor() {
        this.root = new ContainerEntry("");
    }

    /** Build Or Rebuild Container Index */
    build() {}

    change(old_id, new_id = "", delimeter = "/") {

        //No change on notes with same id
        if (old_id === new_id || !new_id)
            return { id: this.get(old_id), val: old_id };

        if (!new_id)
            return { id: null, val: new_id };

        const { uid, val } = this.get(new_id, delimeter);
        const { uid:old_uid, val:old_val } = this.get(new_id, delimeter);

        return { uid, val, old_val, old_uid };
    }

    get(id, delimeter = "/") {
        const array = getContainerArray(getContainerPortion(id + "", delimeter + ""), delimeter + "");
        var {val, uid} = getOrCreateContainerEntry(this.root, array)
        return {uid, val};
    }

    query(container_query) {

    }
}
