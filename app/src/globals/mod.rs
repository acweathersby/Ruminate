use lib_ruminate::store_create;

pub static mut DEFAULT_PATH: &str = "/tmp/ruminate";

pub static mut GLOBAL_STORE: Option<lib_ruminate::store::store::Store> = None;

pub type CRDTDataType = u8;

pub fn init_store(){
    unsafe { GLOBAL_STORE = Some(store_create()) };
}
