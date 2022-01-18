use crate::primitives::note::Note;

use super::container::ContainerStore;
use super::{container::Container, tag::TagStore};

// #[allow(non_camel_case_types)]
use super::super::primitives::crdt::ASCII_CRDT;
///
use super::super::primitives::uuid::UUID;
use std::cell::RefMut;
use std::collections::{BTreeMap, HashMap, HashSet};

pub type NoteLocalID = u32;

pub type NoteUUID = UUID;

pub type NoteLinkID = u32;

pub type NoteLinkMeta = NoteMeta;

pub type NoteInternalCRDT = ASCII_CRDT;

pub type TagLocalID = u32;

pub type TagString = &'static str;

pub type SiteLocalID = u32;

pub type SiteUUID = UUID;

pub type SiteName = String;

// Normally these objects would be replaced with a table
// mechanism, but that process will be deferred until a
// later point.
pub struct Store {
    pub containers: ContainerStore,
    pub notes: BTreeMap<UUID, Box<Note>>,

    //Deprecate the following
    pub note_uuid_to_local_id: HashMap<NoteUUID, NoteLocalID>,
    pub note_local_id_to_uuid: HashMap<NoteLocalID, NoteUUID>,
    pub note_id_to_note_content: HashMap<NoteLocalID, Box<NoteInternalCRDT>>,

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

impl Store {
    pub fn new() -> Self {
        Store {
            containers: ContainerStore::new(),
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

static mut global_store: Option<Store> = None;
pub struct NoteMeta {}
