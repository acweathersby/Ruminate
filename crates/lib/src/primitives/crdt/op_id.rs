use std::cmp::Ordering;

const SITE_BIT_SIZE: u32 = 5;
const CLOCK_MASK: u32 = !((1 << SITE_BIT_SIZE) - 1);
const SITE_MASK: u32 = !CLOCK_MASK;

/// Stores CRDT information necessary
/// to resolve conflicts from different
/// sites.

#[repr(C, packed)]
#[derive(Copy, Clone)]
pub struct OPID {
    /**
     * Stores The site id (5 bits - 32 possible sites) and clock ()
     */
    data: u32,
}

impl OPID {
    pub fn get_null_op() -> OPID {
        return OPID { data: 0 };
    }

    pub fn new(site: u32, clock: u32) -> Self {
        OPID {
            data: (clock << SITE_BIT_SIZE) | (site & SITE_MASK),
        }
    }
    /** Set the value of the clock portion of the underlying id */
    pub fn set_clock(&mut self, clock: u32) {
        self.data = (self.data & !CLOCK_MASK) | ((clock as u32) << SITE_BIT_SIZE);
    }

    /** Set the value of the site portion of the underlying id */
    pub fn set_site(&mut self, site: u8) {
        self.data = (self.data & !SITE_MASK) | ((site as u32) & SITE_MASK);
    }
    /** Return the value of the adjusted clock portion of the underlying id */
    pub fn get_clock(&self) -> u32 {
        (self.data & CLOCK_MASK) >> SITE_BIT_SIZE
    }

    /** Return the value of the adjusted site portion of the underlying id */
    pub fn get_site(&self) -> u32 {
        self.data & SITE_MASK
    }

    /** Test whether this OPID is the same as other */
    pub fn equals(&self, other: &Self) -> bool {
        self.data == other.data
    }

    /** Test whether this OPID should be ordered after other */
    pub fn follows(&self, other: &Self) -> bool {
        (self.data - other.data) == 1
    }

    pub fn increment(&self) -> OPID {
        OPID::new(self.get_site(), self.get_clock() + 1)
    }
}

use std::fmt;
impl fmt::Debug for OPID {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("OPID")
            .field("clock", &self.get_clock())
            .field("site", &self.get_site())
            .finish()
    }
}

impl PartialEq for OPID {
    fn eq(&self, other: &Self) -> bool {
        self.equals(other)
    }
}

impl PartialOrd for OPID {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        let a = self.data;
        let b = other.data;
        match a as i64 - b as i64 {
            0 => Some(Ordering::Equal),
            r if r > 0 => Some(Ordering::Greater),
            r if r < 0 => Some(Ordering::Less),
            _ => Some(Ordering::Equal),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_opid() {
        let mut a = OPID::new(3, 20);

        let b = OPID::new(3, 20);
        let c = OPID::new(2, 40);
        let d = OPID::new(4, 40);

        assert_eq!(a.get_clock(), 20);
        assert_eq!(a.get_site(), 3);

        assert_eq!(a.equals(&b), true);
        assert_eq!(a.equals(&c), false);

        assert_eq!(a == b, true);
        assert_eq!(a == c, false);

        assert_eq!(a > b, false);
        assert_eq!(a < b, false);

        assert_eq!(a >= b, true);
        assert_eq!(a <= b, true);

        assert_eq!(a < c, true);
        assert_eq!(c < d, true);

        a.set_clock(40);
        a.set_site(8);

        assert_eq!(a.get_clock(), 40);
        assert_eq!(a.get_site(), 8);
    }
}
