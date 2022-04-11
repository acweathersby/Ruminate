use rand::random;
use std::hash::Hash;
const RUMI_MAGIC_NUMBER: u32 = 0x52_55_3F_3B;

#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen(inline_js = r#"
export function performance_now(){
    return Date.now();
}"#)]
extern "C" {
    fn performance_now() -> f64;
}

#[cfg(target_arch = "wasm32")]
fn get_u64_timestamp() -> u64 {
    performance_now() as u64
}

#[cfg(any(target_arch = "x86_64", target_arch = "x86"))]
fn get_u64_timestamp() -> u64 {
    use std::time::SystemTime;

    match SystemTime::now().duration_since(SystemTime::UNIX_EPOCH) {
        Ok(time) => time.as_micros() as u64,
        Err(_) => 0,
    }
}

/**
A universal unique identifier for ruminate primitives
 */
#[derive(Debug, Clone, Copy, Hash, PartialEq, Eq)]
pub struct UUID {
    created_time: u64,
    magic: u32,
    random: u32,
}

impl UUID {
    
    pub const fn byte_size()  -> usize {
        return ::std::mem::size_of::<Self>()
    }

    pub fn as_bytes(&self) -> &[u8] {
        unsafe { ::std::slice::from_raw_parts(
            (self as *const Self) as *const u8,
            ::std::mem::size_of::<Self>(),
        ) }
    }

    pub fn from_bytes(bytes : &[u8]) -> Self {
        if bytes.len() == ::std::mem::size_of::<Self>(){
            UUID {
               created_time: u64::from_le_bytes(bytes[0..8].try_into().expect("String")),
               magic: u32::from_le_bytes(bytes[8..12].try_into().expect("String")),
               random: u32::from_le_bytes(bytes[12..].try_into().expect("String")), 
            }
        } else{
            UUID::new(0)
        }
    }

    pub fn new(site_u32_id: u32) -> Self {
        let rand: u32 = random();
        UUID {
            created_time: get_u64_timestamp(),
            magic: RUMI_MAGIC_NUMBER,
            random: rand ^ site_u32_id,
        }
    }

    pub fn from(string_uuid: &String) -> Result<Self, ()> {
        let parts: Vec<&str> = string_uuid.split("_").collect();
        let A = u64::from_str_radix(parts[0].as_ref(), 10);
        let B = u32::from_str_radix(parts[1].as_ref(), 10);
        let C = u32::from_str_radix(parts[2].as_ref(), 10);
        if let Ok(created_time) = A {
            if let Ok(magic) = B {
                if let Ok(random) = C {
                    return Ok(UUID {
                        created_time,
                        magic,
                        random,
                    });
                }
            }
        };
        return Err(());
    }
}



impl ToString for UUID {
    fn to_string(&self) -> String {
        
        let mut string: String = "".to_string();

        string += &self.created_time.to_string();
        string += "_";
        string += &self.magic.to_string();
        string += "_";
        string += &self.random.to_string();

        string
    }
}

impl Default for UUID {
    fn default() -> Self {
        Self::new(0)
    }
}

#[cfg(test)]
mod tests {

    use super::*;

    #[test]
    fn uuid_test() {
        let uuid_a = UUID::new(10);
        let uuid_b = UUID::new(20);

        assert_ne!(uuid_a, uuid_b);

        println!("{:?}", uuid_a)
    }
}
