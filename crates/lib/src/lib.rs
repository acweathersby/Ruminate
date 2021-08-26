/**
 * Ruminate Library
 *
 * Copyright 2021 Anthony C Weathersby
 *
 * All rights reserved
 *
 * See License at ../../LICENSE.md
 *
 * If license was not provided with this distribution then refer to
 * github.com/acweathersby/ruminate/LICENSE.md
 */
//---
mod primitives;

/// Place Holder Function
///
/// Temporary function for language orientation
pub fn placeholder() -> u32 {
    50
}

#[cfg(test)]

mod tests {
    use super::*;

    #[test]
    fn it_placeholder_unit() {
        assert_eq!(placeholder(), 50);
    }
}
