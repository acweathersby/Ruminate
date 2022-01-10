use super::super::primitives::uuid::UUID;
use std::collections::{HashMap, HashSet};

/**
   Map from tag string to a set of Note UUIDS
*/
pub struct Tag {
    pub name: String,
    pub uuids: HashSet<UUID>,
}
pub struct TagStore {
    pub tags: HashMap<String, Tag>,
}

impl TagStore {
    pub fn new() -> TagStore {
        TagStore {
            tags: HashMap::new(),
        }
    }
}
