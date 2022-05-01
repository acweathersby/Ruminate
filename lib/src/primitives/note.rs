use super::{
    crdt::{self, CRDTString},
    uuid::UUID,
};

pub struct CRDTNote {
    uuid: UUID,
    created: u64,
    modified: u64,
    tags: Vec<String>,
    ////////////////////////////
    data: CRDTString<u8>,
}


