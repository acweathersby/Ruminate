use crate::primitives::{NoteLocalID, TagLocalID, SiteLocalID, SiteUUID, SiteName, NoteData, NoteUUID};
use crate::primitives::{container::Container};

use super::{tag::TagStore};

// #[allow(non_camel_case_types)]
use super::super::primitives::crdt::ASCII_CRDT;
///
use super::super::primitives::uuid::UUID;
use std::cell::RefMut;
use std::collections::{BTreeMap, HashMap, HashSet};



// Normally these objects would be replaced with a table
// mechanism, but that process will be deferred until a
// later point.
pub struct Store<T> {

    pub containers: Container<NoteLocalID>,
    pub notes: BTreeMap<UUID, Box<NoteData<T>>>,

    pub note_uuid_to_local_id: HashMap<NoteUUID, NoteLocalID>,
    pub note_local_id_to_uuid: HashMap<NoteLocalID, NoteUUID>,
    pub note_id_to_note_content: HashMap<NoteLocalID, Box<NoteData<T>>>,

    // Tags can have implied hierarchy by using some
    // kind of tag name delimiter, such as '/', within
    // tag name itself. It's up to the consumer of the
    // note database to decide how to display such tag
    // names.
    pub tag_id_to_string: HashMap<TagLocalID, String>,
    pub tag_string_to_id: HashMap<String, TagLocalID>,
    pub tag_id_to_note_id_list: HashMap<TagLocalID, HashSet<NoteLocalID>>,
    pub note_id_to_tag_id_list: HashMap<NoteLocalID, HashSet<TagLocalID>>,
    pub path_to_note_id: HashMap<String, Vec<NoteLocalID>>,
    pub note_id_to_name: HashMap<NoteLocalID, String>,
    pub note_id_to_container_path: HashMap<NoteLocalID, String>,

    pub site_uuid_to_local_site: HashMap<SiteLocalID, SiteUUID>,
    pub site_uuid_to_name: HashMap<SiteLocalID, SiteName>,
}

impl<T> Store<T> {
    pub fn new() -> Self {
        Store::<T> {
            containers: Container::<NoteLocalID>::new_threaded(),
            notes: BTreeMap::new(),

            // Note Components ////////////////////
            note_id_to_name: HashMap::new(),
            note_id_to_container_path: HashMap::new(),
            note_uuid_to_local_id: HashMap::new(),
            note_local_id_to_uuid: HashMap::new(),
            note_id_to_note_content: HashMap::new(),
            path_to_note_id: HashMap::new(),

            // TAGS ///////////////////////////////
            tag_id_to_string: HashMap::new(),
            tag_string_to_id: HashMap::new(),
            tag_id_to_note_id_list: HashMap::new(),
            note_id_to_tag_id_list: HashMap::new(),
            ///////////////////////////////////////
            site_uuid_to_local_site: HashMap::new(),
            site_uuid_to_name: HashMap::new(),
        }
    }
}

