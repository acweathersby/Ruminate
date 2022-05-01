use lib_ruminate::store_create;

type ASCII = u8;
type CRDT_TYPE = ASCII;
type _GLOBAL_STORE_ =  Option<lib_ruminate::store::store::Store<CRDT_TYPE>>;

pub static mut DEFAULT_PATH: &str = "/tmp/ruminate";

pub static mut GLOBAL_STORE:_GLOBAL_STORE_ = None;

pub type CRDTDataType = u8;

pub fn init_store(){
    unsafe { GLOBAL_STORE = Some(store_create()) };
}

pub fn get_store<'a>() -> Option<&'a mut lib_ruminate::store::store::Store<CRDT_TYPE>>{
    unsafe { GLOBAL_STORE.as_mut() }
}