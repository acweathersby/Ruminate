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
    pub fn new(site_u32_id: u32) -> UUID {
        let rand: u32 = random();
        UUID {
            created_time: get_u64_timestamp(),
            magic: RUMI_MAGIC_NUMBER,
            random: rand ^ site_u32_id,
        }
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
