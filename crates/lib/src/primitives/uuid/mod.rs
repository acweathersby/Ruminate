use rand::random;
use std::time::SystemTime;
const RUMI_MAGIC_NUMBER: u32 = 0x52_55_3F_3B;

/**
A universal unique identifier for ruminate primitives
 */
#[derive(Debug, Clone, Copy)]
pub struct UUID {
    created_time: u64,
    magic: u32,
    random: u32,
}

impl UUID {
    fn new(site_u32_id: u32) -> UUID {
        let rand: u32 = random();
        UUID {
            created_time: match SystemTime::now().duration_since(SystemTime::UNIX_EPOCH) {
                Ok(time) => time.as_micros() as u64,
                Err(_) => 0,
            },
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

impl PartialEq for UUID {
    fn eq(&self, other: &Self) -> bool {
        self.created_time == other.created_time
            && self.magic == other.magic
            && self.random == other.random
    }

    fn ne(&self, other: &Self) -> bool {
        !self.eq(other)
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
