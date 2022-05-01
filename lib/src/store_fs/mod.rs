/*!
    General handler functions for storing and retrieving notes from
    a filesystem directory.
 */

const  MagicNumber : &[u8;9] = b"RUMI_NOTE";

use std::{str::FromStr, fs::{File, self}, path::{Path, PathBuf}, io::{Write, self, Read}, fmt::Debug};

use log::debug;

use crate::{
    store::store::{Store}, 
    store_create, 
    note_create_binary, 
    note_create_text, 
    note_insert_text, 
    note_get_text, 
    note_get_uuid_from_local_id, 
    primitives::{
        uuid::UUID, 
        crdt::{ CRDTString, CRDTData}, NoteData, NoteLocalID, binary::BinaryStream
    }, 
    note_get_data
};

// CreateFileName - A function for creating a standard note file name
// from note data. 
pub fn create_file_name<T: CRDTData>(note_local_id: NoteLocalID, store: &mut Store<T>)-> Result<(String, UUID), &'static str> { 
    if let Some(uuid) = note_get_uuid_from_local_id(store, note_local_id){ 
        debug!("Saving note [{:?}]", uuid);
        Ok((uuid.to_string() + ".rnote", uuid))
    }else {
        Err("Could Not Create Note File Name")
    }
}

// RecognizeFileName - A function for recognizing note file from a file path. 
pub fn recognize_file_name(candidate_path: &Path) -> bool { 
    true
}

/// Saves a single note's data to a directory path. The note name is automatically generated. 
/// 
/// Returns a void Result or forwards IO errors if encountered.
/// 
pub fn save<T: CRDTData>(directory_path: &String, note_local_id: NoteLocalID, store: &mut Store<T>) -> io::Result<()> {
    if let Ok((file_name, uuid)) = create_file_name(note_local_id, store){ 

        let path_str = directory_path.to_owned() + "/" + &file_name;

        let path = Path::new(&path_str);

        let mut file = File::create(path)?;
            //First bytes are a RUMI_NOTE magic number
        if file.write(MagicNumber)? == MagicNumber.len() {
            
            file.write( uuid.as_bytes())?;

            if let Some(content) = note_get_data(store, note_local_id){

                match content {
                    NoteData::<T>::BINARY(data) => {
                        file.write(&[1 as u8]);
                        data.write_to_file(&mut file)?
                    },
                    NoteData::<T>::CRDT(data) => {
                        file.write(&[2 as u8]);
                        data.write_to_file(&mut file)?
                    }
                };

                Ok(())   
            }else {
                Err(std::io::Error::new(
                    io::ErrorKind::InvalidData, 
                    "Failed to save note data")
                )
            }
        }else {
            Err(std::io::Error::new(
                io::ErrorKind::InvalidData, 
                "Failed to save RUMI_NOTE magic header")
            )
        }
        
    } else {
        debug!("Failed to acquire note UUID from local note id.");
        Err(std::io::Error::new(
            io::ErrorKind::InvalidInput, 
            "Failed to acquire note UUID from local note id.")
        )
    }
 }
 
/// Load a single note from a filepath
pub fn load<T: CRDTData>(candidate_path: &Path) -> io::Result<(UUID,NoteData<T>)>  {

    if candidate_path.is_file() {

        let mut file = File::open(candidate_path)?;

        let mut buf: [u8; MagicNumber.len()] = [0; MagicNumber.len()];

        file.read_exact(&mut buf)?;

        if buf.eq(MagicNumber) {
            
            let mut buf: [u8; UUID::byte_size()] = [0; UUID::byte_size()];
            
            file.read_exact(&mut buf)?;
            
            println!("{:?}", &buf);

            let uuid = UUID::from_bytes(&buf);

            //Read contents

            println!("{:?}", &uuid);

            let mut type_buf = [0 as u8;1];
            
            file.read_exact(&mut type_buf);

            if type_buf [0] == 1 {

                let data= NoteData::<T>::BINARY(
                    Vec::<u8>::read_from_file(&mut file)?
                );

                return Ok((uuid, data))
            } else {

                let data= NoteData::<T>::CRDT(
                    CRDTString::<T>::read_from_file(&mut file)?
                );
                
                return Ok((uuid, data))
            }
 
        }else {
            return Err(std::io::Error::new(
                io::ErrorKind::InvalidData, 
                "Magic Number Is not a match")
            )        
        }
    }

    Err(std::io::Error::new(io::ErrorKind::AlreadyExists, "test"))
}

 //Scan - Scans a directory for note. This is not a recursive function,
 //It will only scan files within the given directory path.   
pub fn scan(directory_path:&String) -> io::Result<Vec<PathBuf>> { 

    let mut result : Vec<PathBuf> = Vec::new();

    for entry in fs::read_dir(directory_path)? {
        
        let entry = entry?;

        let path = entry.path();    

        if path.is_file() && recognize_file_name(&path){
            result.push(path);
        }
    }

    return Ok(result);
}


#[test]
fn test_note_save() {

    const TEST_STRING:&str = "Test Data";

    //Create temp directory - expecting unix like directory structure
    let tmp_directory = String::from("/tmp/ruminate/fs_store");
    std::fs::remove_dir_all(&tmp_directory);
    std::fs::create_dir_all(&tmp_directory);

    if let Ok(result) = std::fs::try_exists(&tmp_directory) {
        assert!(result == true);
    }else {
        panic!("Failed to create tmp directory [{:?}]", &tmp_directory);
    }

    //Create a new zxxxxxxxnote and prepare it for saving
    let mut store = store_create::<u8>();

    let note_local_id = note_create_text::<u8>(&mut store);

    if let Some(note_uuid) = note_get_uuid_from_local_id(&mut store, note_local_id){

        assert!(note_local_id > 0);

        if let Ok(()) = note_insert_text(&mut store, note_local_id, 0, TEST_STRING.as_bytes()) {

            if let Ok(()) =  save(&tmp_directory, note_local_id, &mut store){

                let mut have_note = false;

                if let Ok(found_notes) = scan(&tmp_directory) {                
                    
                    if found_notes.len() < 1 {
                        panic!("Could not find saved note")
                    }
                    
                    if let Some(note_path) = found_notes.get(0){   
                        match load::<u8>(note_path) {
                            Ok((uuid, data)) => {

                                have_note = true;
                                
                                assert_eq!(note_uuid, uuid);

                                match data {
                                    NoteData::<u8>::BINARY(data) =>{
                                        panic!("Note data incorrectly interpreted as binary")    
                                    },
                                    NoteData::<u8>::CRDT(data) =>{
                                        if let Ok(strA) = String::from_utf8(data.vector()) {
                                            assert_eq!(strA, TEST_STRING);
                                        }else {
                                            panic!("Unable to read note data")    
                                        }
                                    },
                                }
                            },
                            Err(e) => {
                                println!("{:?}", e);
                                panic!("Did not load any note data")         
                            }
                        }
                    }
                    
                }
            }else{
                panic!("Failed to save note")     
            }

        } else {
            panic!("Failed to write to note CRDT")
        }
    }else {
        panic!("Could not acquire UUID")
    }

    
}