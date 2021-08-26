use std::fmt::Debug;

use super::op_id::OPID;

/**
Store CRDT data in an opaque buffer and provides
operations to retrieve, modify, and slice data
into various formats.
*/
#[derive(Debug)]
pub struct CRDTString<T> {
    ops: Vec<(OPID, T)>,
    latest: OPID,
}

pub trait CRDTDelete {
    /// * Return a value that represents the
    ///  * delete command in a CRDTString
    fn delete_command() -> Self;

    fn is_delete(candidate: Self) -> bool;
}

impl<T> CRDTString<T>
where
    T: Copy + Clone + Default + Debug + CRDTDelete,
{
    pub fn new(site: u32) -> CRDTString<T> {
        let mut vec: Vec<(OPID, T)> = Vec::new();

        vec.push((OPID::new(0, 0), T::default()));
        //Do some shit to make sure site value is correct
        CRDTString {
            ops: vec,
            latest: OPID::new(site, 0),
        }
    }

    /// Merge one foreign CRDT string with this one, returning
    /// a new CRDT string that is the union of the two.
    ///  
    /// This should only be used with CRDT strings that have the
    /// same origin.
    pub fn merge(&mut self, other: &Self, other_site_id: u32, other_last_clock: u32) {
        let data = other.export(other_last_clock, other_site_id);

        for (parent_op, child_op, command) in data.iter() {
            if child_op.get_clock() > self.latest.get_clock() {
                self.latest.set_clock(child_op.get_clock() + 1)
            }

            self.insert_op(*parent_op, (*child_op, *command), 0);
        }
    }

    fn insert_op(
        &mut self,
        parent_clock: OPID,
        candidate: (OPID, T),
        cached_index: usize,
    ) -> usize {
        // Hunt down origin operator
        let (candidate_id, op) = candidate;
        let ops_len: usize = self.ops.len();

        if ops_len == 0 {
            self.ops.push(candidate);

            return ops_len;
        } else {
            for i in cached_index..ops_len {
                if self.ops[i].0 == parent_clock {
                    let mut peer_position = i + 1;

                    if T::is_delete(op) {
                        //Only need to store one delete per operation.
                        if peer_position < ops_len && T::is_delete(self.ops[peer_position].1) {
                            return peer_position;
                        }
                    } else {
                        while peer_position < ops_len {
                            let (peer_id, peer_op) = self.ops[peer_position];

                            if peer_id == candidate_id {
                                return peer_position;
                            } else if peer_id < candidate_id && !T::is_delete(peer_op) {
                                break;
                            }

                            peer_position += 1;
                        }
                    }

                    if peer_position < ops_len {
                        self.ops.insert(peer_position, candidate);
                    } else {
                        self.ops.push(candidate)
                    }

                    return peer_position;
                }
            }
        }

        usize::MAX
    }

    fn get_op_at_index(&self, index: usize) -> (OPID, usize) {
        let len = self.ops.len();
        let mut i = 0 as usize;
        let mut counter = 0 as usize;

        while i < len {
            let (op, command) = self.ops[i];
            if T::is_delete(command) {
                counter -= 1;
            } else if counter == index {
                return (op, i);
            }
            counter += 1;
            i += 1
        }
        (OPID::get_null_op(), usize::MAX)
    }

    pub fn delete(&mut self, index: usize, num_of_deletions: u32) {
        for i in 0..num_of_deletions {
            let adjusted_index = i as usize + index;

            //Need to make sure all removals match against an OPID
            //Stop when this is not true.
            let (mut parent_op, op_index) = self.get_op_at_index(adjusted_index);

            if op_index < usize::MAX {
                let new_op_id = self.latest.increment();
                let operation: T = T::delete_command();

                self.insert_op(parent_op, (new_op_id, operation), 0);
            } else {
                break;
            }
        }
    }

    pub fn insert(&mut self, index: usize, string: &[T]) {
        let (mut parent_op, mut op_index) = self.get_op_at_index(index);

        if op_index < usize::MAX {
            for operation in string {
                let new_op_id = self.latest.increment();

                op_index = self.insert_op(parent_op, (new_op_id, *operation), op_index);

                self.latest = new_op_id;

                parent_op = self.latest;
            }
        }
    }

    pub fn vector(&self) -> Vec<T> {
        let mut vec: Vec<T> = Vec::with_capacity(self.ops.len());

        for (_, operation) in self.ops.iter() {
            vec.push(*operation)
        }

        vec
    }

    pub fn export(&self, since: u32, site: u32) -> Vec<(OPID, OPID, T)> {
        let mut i: usize = 1;

        let mut vec: Vec<(OPID, OPID, T)> = Vec::with_capacity(self.ops.len());

        for i in 0..self.ops.len() {
            let (op, data) = self.ops[i];

            if op.get_site() == site && op.get_clock() > since {
                for j in (0..=(i - 1)).rev() {
                    let (par_op, command) = self.ops[j];

                    if !T::is_delete(command) && par_op < op {
                        vec.push((par_op, op, data));
                        break;
                    }
                }
            }
        }
        return vec;
    }

    pub fn import(&mut self, data: Vec<(OPID, OPID, T)>) {}
}

#[cfg(test)]
mod tests {
    use super::*;
    impl CRDTDelete for u8 {
        fn delete_command() -> Self {
            8 // ASCII Backspace
        }

        fn is_delete(candidate: Self) -> bool {
            candidate == 8
        }
    }
    #[test]
    fn test_crdt_string() {
        let mut stringA: CRDTString<u8> = CRDTString::new(1);
        let mut stringB: CRDTString<u8> = CRDTString::new(2);
        let mut stringC: CRDTString<u8> = CRDTString::new(3);

        stringA.insert(0, "AAAA".as_bytes());
        stringB.insert(0, "BBBB".as_bytes());

        stringA.merge(&stringB, 2, 0);

        println!("{:?}", String::from_utf8(stringA.vector()));
        println!("{:?}", String::from_utf8(stringB.vector()));

        stringA.insert(0, "D2D2".as_bytes());
        stringB.insert(2, "C2C2".as_bytes());

        println!("{:?}", String::from_utf8(stringA.vector()));
        println!("{:?}", String::from_utf8(stringB.vector()));

        stringA.merge(&stringB, 2, 0);
        stringB.merge(&stringA, 1, 0);

        stringC.merge(&stringA, 1, 0);
        stringC.merge(&stringB, 2, 0);

        println!("{:?}", String::from_utf8(stringA.vector()));
        println!("{:?}", String::from_utf8(stringB.vector()));
        println!("{:?}", String::from_utf8(stringC.vector()));
    }
}
