use crate::{
    globals::{
        DEFAULT_PATH, 
        GLOBAL_STORE, 
        init_store
    }, 
    bridge::{
        insert_text, 
        create_note, 
        get_text
    }, 
    store::{load_notes, get_main_path}
};

#[test]
fn test_store_scan() {

    unsafe { DEFAULT_PATH = "/tmp/test_scan/" };

    init_store();
    //create some notes

    std::fs::remove_dir_all(&get_main_path());
    std::fs::create_dir_all(&get_main_path());

    if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
        
        insert_text(create_note(), 0, String::from("Testing, this is a test note"));
        insert_text(create_note(), 0, String::from("Testing, this is a test note"));
        insert_text(create_note(), 0, String::from("Testing, this is a test note"));

        // Reset global store
        init_store();

        load_notes();

        if let Some(store_new) = unsafe { GLOBAL_STORE.as_mut() } {

            assert!(store_new.note_id_to_note_content.len() > 0);

            assert!(store_new.note_id_to_note_content.len() == 3);

            let text = get_text(1);

            assert!(text == "Testing, this is a test note");
        }
    }
}