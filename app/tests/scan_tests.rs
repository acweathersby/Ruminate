use app;

#[cfg(test)]
mod store_tests {


    #[test]
    fn test_store_scan() {

        unsafe { DEFAULT_PATH = "/tmp/test_scan/" };

        init_store();

        //create some notes

        if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
            
            insert_text( create_note(), 0, String::from("test"));
            insert_text(create_note(), 0, String::from("test"));
            insert_text(create_note(), 0, String::from("test"));

            //reset global store;
            init_store();

            load_notes();

            if let Some(store_new) = unsafe { GLOBAL_STORE.as_mut() } {

                assert!(store_new.notes.len() > 0);

                assert!(store_new.notes.len() == 3);
            }
        }
    }
}