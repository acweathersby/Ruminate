export default class NoteContainer extends Array {
    push() {}
    shift() {}
    unshift() {}
    pop() {}
    sort(sorter) {
        
        if (typeof sorter == "function") 
            return new NoteContainer(...([...this]).sort(sorter));
        
        throw new TypeError("The comparison function must be either a function or a sort_index")
    }
}

NoteContainer.sort_indexes = Object.freeze({
    create_time: (m1,m2)=>{ m1.created < m2.created ? -1 : 1 },
    modify_time: (m1,m2)=>{ m1.modified < m2.modified ? -1 : 1 },
    id: (m1,m2)=>{ m1.id < m2.id ? -1 : 1 },
    tags: (m1,m2)=>{ m1.tags < m2.tags ? -1 : 1 },
    body: (m1,m2)=>{ m1.body < m2.body ? -1 : 1 }
})
