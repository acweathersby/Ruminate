pub mod op_id;

use log::debug;
use op_id::OPID;
use std::{fmt::Debug, fs::File, io::{Write, self, Read}, borrow::Borrow};

use super::binary::BinaryStream;

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

pub trait CrdtIO {
    
    fn as_bytes(&self) -> &[u8];

    fn to_utf8(&self, output:&mut Vec<u8>);

    fn from_file(file:&mut File) -> io::Result<Self> where Self: Sized;

}

pub trait CRDTData = Copy + Clone + Default + Debug + CRDTDelete + CrdtIO;

impl<T> CRDTString<T>
where
    T: CRDTData,
{
    pub fn new(site: u32) -> CRDTString<T> {
        
        //Do some shit to make sure site value is correct
        CRDTString {
            ops: Vec::new(),
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
            if parent_clock == OPID::get_null_op() {
                self.ops.push(candidate);
            }
            return 0;
        } else {
            let mut i = cached_index;
            let parent_clock_is_null = parent_clock == OPID::get_null_op();
            let mut peer_position = 0;

            if parent_clock_is_null {
                i = 0;
            } else {
                while i < ops_len {
                    if self.ops[i].0 == parent_clock {
                        break;
                    }
                    i += 1;
                }
                peer_position = i + 1;
            }

            if i < ops_len || parent_clock_is_null {
                if T::is_delete(op) {
                    //Delete operations are insert BEFORE their target.
                    //Only one delete operation per target is allowed.

                    if i > 0 && T::is_delete(self.ops[i - 1].1) {
                        return i;
                    } else {
                        self.ops.insert(i, candidate);
                        return i + 1;
                    }
                } else {
                    let mut cursor = peer_position;

                    while cursor < ops_len {
                        let (mut peer_id, peer_op) = self.ops[cursor];

                        if T::is_delete(peer_op) {
                            //Consider the following object as
                            //the insert the candidate, but do not
                            // advance the cursor until after consideration
                            // to ensure the delete operation is left in place
                            // immediately before its target.
                            cursor += 1;

                            peer_id = self.ops[cursor].0;
                        }

                        if peer_id == candidate_id {
                            return cursor;
                        } else if peer_id < candidate_id {
                            break;
                        }
                        cursor += 1;
                        peer_position = cursor;
                    }

                    if peer_position < ops_len {
                        self.ops.insert(peer_position, candidate);
                    } else {
                        self.ops.push(candidate)
                    }
                }
                return peer_position;
            }
        }

        usize::MAX
    }

    fn get_op_at_index(&self, index: usize) -> (OPID, usize) {
        let len = self.ops.len();
        let mut i = 0 as usize;
        let mut counter: i32 = 0;

        if len == 0 {
            return (OPID::get_null_op(), 0);
        }

        while i < len {
            let (op, command) = self.ops[i];
            if T::is_delete(command) {
                counter -= 1;
                i += 1; // Skip over the delete operation's target
            } else if counter as usize == index {
                return (op, i);
            }
            counter += 1;
            i += 1
        }
        (OPID::get_null_op(), usize::MAX)
    }

    pub fn delete(&mut self, index: usize, num_of_deletions: u32) {
        for _ in 0..num_of_deletions {
            let adjusted_index = index;

            //Need to make sure all removals match against an OPID
            //Stop when this is not true.
            let (mut parent_op, op_index) = self.get_op_at_index(adjusted_index);

            if op_index < usize::MAX {
                let new_op_id = self.latest.increment();
                let operation: T = T::delete_command();

                self.insert_op(parent_op, (new_op_id, operation), 0);

                self.latest = new_op_id;
            } else {
                break;
            }
        }
    }

    pub fn insert(&mut self, index: usize, string: &[T]) {
        let (mut par_id, mut op_index) = if index == 0 {
            (OPID::get_null_op(), 0)
        } else {
            self.get_op_at_index(index - 1)
        };

        if op_index < usize::MAX {
            for operation in string {
                let new_id = self.latest.increment();

                op_index = self.insert_op(par_id, (new_id, *operation), op_index);

                self.latest = new_id;

                par_id = self.latest;
            }
        }

        debug!(target:"tag actions", "Inserted [{:?}] operators into CRDT. Clock is now [{:?}]", string.len(), self.latest);
    }

    pub fn vector(&self) -> Vec<T> {
        let mut vec: Vec<T> = Vec::with_capacity(self.ops.len());

        let mut i: usize = 0;

        let len = self.ops.len();

        while i < len {
            let (_, operation) = self.ops[i];

            if T::is_delete(operation) {
                //Skip the next operation since
                //it has been deleted.
                i += 1
            } else {
                vec.push(operation)
            }

            i += 1
        }

        vec
    }

    pub fn utf8(&self) -> Vec<u8> {
        let mut vec: Vec<u8> = Vec::with_capacity(self.ops.len());

        let mut i: usize = 0;

        let len = self.ops.len();

        while i < len {
            let (_, operation) = self.ops[i];

            if T::is_delete(operation) {
                //Skip the next operation since
                //it has been deleted.
                i += 1
            } else {
                operation.to_utf8(&mut vec);
            }

            i += 1
        }

        vec
    }

    pub fn get_local_clock(&self) -> OPID {
        return self.latest;
    }

    pub fn export(&self, since: u32, site: u32) -> Vec<(OPID, OPID, T)> {
        let mut vec: Vec<(OPID, OPID, T)> = Vec::with_capacity(self.ops.len());

        for i in 0..self.ops.len() {
            let (id, op) = self.ops[i];

            if id.get_site() == site && id.get_clock() > since {
                if T::is_delete(op) {
                    // A delete operation will always push it's target
                    // to the output vec before it is pushed to the same
                    // vec to ensure a target can does exist when merging
                    let (parent_id, parent_op) = self.ops[i + 1];

                    vec.push((
                        self.get_parent_opid(parent_id, i as i32),
                        parent_id,
                        parent_op,
                    ));

                    vec.push((parent_id, id, op));
                } else if i == 0 {
                    vec.push((OPID::get_null_op(), id, op));
                } else {
                    vec.push((self.get_parent_opid(id, i as i32), id, op));
                }
            }
        }
        return vec;
    }

    fn get_parent_opid(&self, child_id: OPID, child_index: i32) -> OPID {
        let mut j: i32 = child_index - 1;

        while j > -1 {
            let (par_id, op) = self.ops[j as usize];

            if !T::is_delete(op) && par_id < child_id {
                return par_id;
            }

            j -= 1;
        }

        OPID::get_null_op()
    }
}



impl<T> BinaryStream for CRDTString<T> where T : CRDTData  {
    
    fn read_from_file(file:&mut File) -> io::Result<Self>{
        let mut buf : [u8;8] = [0;8];
        file.read_exact(&mut buf)?;
        let ops_len = usize::from_le_bytes(buf);
        let latest  = OPID::from_file(file)?;
        let mut ops :Vec<(OPID, T)>= Vec::new();

        for _ in 0..ops_len {
            let op_id = OPID::from_file(file)?;
            let op_data : T = T::from_file(file)?;
            ops.push((op_id, op_data)) 
        }

        Ok(CRDTString {
            ops,
            latest
        })
    }

    fn write_to_file(&self, file:&mut File) -> io::Result<()>{
       
        file.write(&self.ops.len().to_le_bytes())?;
        file.write(&self.latest.as_bytes())?;
       
        for ( op, data) in &self.ops {
            file.write(op.as_bytes())?;
            file.write(&data.as_bytes())?;
        }

        Ok(())
    }
}

impl CRDTDelete for u8 {
    fn delete_command() -> Self {
        8 // ASCII Backspace
    }

    fn is_delete(candidate: Self) -> bool {
        candidate == 8
    }
}

impl CrdtIO for u8 {

    fn as_bytes(& self) -> &[u8] {
        unsafe { ::std::slice::from_raw_parts(
            (self as *const Self) as *const u8,
            ::std::mem::size_of::<Self>(),
        ) }
    }

    fn to_utf8(&self, output:&mut Vec<u8>) {
        output.push(*self);
    }

    fn from_file(file:&mut File) -> io::Result<Self> {
        let mut buf : [u8;1] = [0;1];
        file.read(&mut buf)?;
        Ok(buf[0])
    }
}

pub type ASCII_CRDT = CRDTString<u8>;

#[cfg(test)]
mod tests {
    use super::*;

    use log::{LevelFilter, Metadata, Record};

    struct SimpleLogger;

    impl log::Log for SimpleLogger {
        fn enabled(&self, metadata: &Metadata) -> bool {
            true
        }

        fn log(&self, record: &Record) {
            println!("{} - {}", record.level(), record.args());
        }

        fn flush(&self) {}
    }
    static LOGGER: SimpleLogger = SimpleLogger;

    fn init_logging() {
        if let Ok(_) = log::set_logger(&LOGGER) {
            log::set_max_level(LevelFilter::Debug);
        }
    }

    #[test]
    fn test_crdt_string() {
        init_logging();

        let mut stringA: CRDTString<u8> = CRDTString::new(1);
        let mut stringB: CRDTString<u8> = CRDTString::new(2);
        let mut stringC: CRDTString<u8> = CRDTString::new(3);

        stringA.insert(0, " AA".as_bytes());
        stringB.insert(0, " 12".as_bytes());

        stringA.merge(&stringB, 2, 0);
        stringB.merge(&stringA, 1, 0);

        stringA.insert(0, " D2 ".as_bytes());
        stringA.delete(0, 2);

        stringB.insert(2, " D1 ".as_bytes());
        stringB.delete(0, 2);

        stringA.merge(&stringB, 2, 0);
        stringB.merge(&stringA, 1, 0);

        assert_eq!(
            String::from_utf8(stringB.vector()),
            String::from_utf8(stringA.vector())
        );

        stringC.merge(&stringB, 2, 0);
        stringC.merge(&stringA, 1, 0);

        assert_eq!(
            String::from_utf8(stringC.vector()),
            String::from_utf8(stringA.vector())
        );
    }

    use std::str::FromStr;

    #[test]
    fn string_deletion_and_addition() {
        init_logging();

        let mut stringA: CRDTString<u8> = CRDTString::new(1);

        stringA.insert(0, "Hello World".as_bytes());
        stringA.delete(0, 11);
        stringA.insert(0, "dddd".as_bytes());
        stringA.delete(0, 4);
        stringA.insert(0, "a".as_bytes());

        if let Ok(string) = String::from_str("a") {
            if let Ok(strA) = String::from_utf8(stringA.vector()) {
                assert_eq!(string, strA);
            }
        }
    }
}
