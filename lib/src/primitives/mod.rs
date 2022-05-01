

use self::{uuid::UUID, crdt::CRDTString, binary::BinaryStream};

pub mod crdt;
pub mod note;
pub mod uuid;
pub mod container;
pub mod binary;

pub type NoteLocalID = u32;

pub type NoteUUID = uuid::UUID;

pub type NoteLinkID = u32;

pub type TagLocalID = u32;

pub type TagString = &'static str;

pub type SiteLocalID = u32;

pub type SiteUUID = uuid::UUID;

pub type SiteName = String;

pub type BinaryData = Vec<u8>;

pub enum NoteData<CharType> {
    CRDT(crdt::CRDTString<CharType>),
    BINARY(BinaryData)
}
