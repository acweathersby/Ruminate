
use candlelib_hydrocarbon::core_parser::*;
const token_lookup: [u16; 492] = [
    22, 0, 0, 0, 0, 0, 32961, 61439, 511, 0, 15, 0, 192, 0, 0, 0, 0, 0, 0, 120, 0, 0, 0, 0, 32961,
    61567, 32259, 65533, 32, 0, 0, 0, 0, 65477, 0, 0, 208, 0, 0, 0, 0, 0, 192, 0, 0, 0, 1920, 0, 0,
    0, 0, 0, 1920, 0, 31425, 57344, 3, 0, 0, 0, 0, 57344, 3, 0, 0, 0, 192, 4096, 0, 0, 0, 0, 192,
    0, 0, 0, 9, 0, 448, 0, 0, 0, 0, 0, 32961, 61319, 511, 0, 15, 0, 32768, 7, 0, 0, 0, 0, 192, 0,
    32256, 61, 0, 0, 32961, 61567, 32259, 65533, 41, 0, 0, 0, 0, 65472, 0, 0, 0, 0, 32256, 56, 0,
    0, 32983, 61567, 3, 65477, 1968, 0, 64, 0, 0, 0, 0, 0, 150, 0, 0, 0, 16, 0, 31425, 57344, 3, 0,
    9, 0, 32983, 61567, 3, 65477, 1952, 0, 31681, 57344, 3, 0, 9, 0, 31232, 0, 0, 0, 0, 0, 31424,
    0, 0, 0, 0, 0, 31680, 57344, 3, 0, 9, 0, 448, 0, 0, 0, 9, 0, 64449, 61567, 32259, 65533, 41, 0,
    14848, 0, 0, 0, 0, 0, 1216, 3968, 508, 0, 15, 0, 0, 3968, 508, 0, 15, 0, 192, 3968, 508, 0, 15,
    0, 0, 2048, 508, 0, 15, 0, 0, 1920, 0, 0, 0, 0, 192, 2048, 508, 0, 15, 0, 0, 0, 508, 0, 0, 0,
    192, 57344, 3, 0, 0, 0, 1217, 8192, 508, 0, 0, 0, 1217, 0, 508, 0, 0, 0, 1217, 32768, 508, 0,
    0, 0, 1217, 0, 509, 0, 0, 0, 1217, 0, 510, 0, 0, 0, 193, 16384, 508, 0, 0, 0, 192, 0, 508, 0,
    0, 0, 192, 0, 12, 0, 0, 0, 32961, 61567, 32263, 65533, 32, 0, 32961, 61567, 32267, 65533, 32,
    0, 192, 0, 48, 0, 0, 0, 32961, 61567, 32275, 65533, 32, 0, 32961, 61567, 32291, 65533, 32, 0,
    192, 0, 192, 0, 0, 0, 192, 0, 256, 0, 0, 0, 208, 0, 0, 0, 9, 0, 192, 0, 1024, 0, 0, 0, 208, 0,
    2048, 58, 9, 0, 208, 0, 32768, 0, 0, 0, 192, 0, 0, 8, 0, 0, 32977, 61567, 3, 65477, 2016, 0, 0,
    0, 0, 0, 1984, 0, 192, 0, 0, 48, 0, 0, 214, 0, 0, 0, 0, 0, 32983, 61567, 2, 65477, 1968, 0,
    32768, 61567, 2, 65477, 32, 0, 192, 0, 0, 65477, 0, 0, 0, 0, 0, 1985, 0, 0, 0, 0, 0, 63492, 0,
    0, 192, 0, 0, 0, 6, 0, 192, 0, 0, 0, 1, 0, 192, 0, 0, 0, 2, 0, 192, 0, 0, 0, 4, 0, 192, 0, 0,
    0, 8, 0, 214, 0, 0, 0, 16, 0, 192, 0, 0, 0, 16, 0, 31424, 57344, 3, 0, 9, 0, 192, 0, 0, 0, 32,
    0, 192, 0, 0, 0, 1984, 0, 32983, 61567, 2, 65477, 48, 0, 64448, 61567, 32259, 65533, 41, 0,
    32982, 61567, 3, 65477, 1968, 0,
];
const token_sequence_lookup: [u8; 225] = [
    47, 58, 63, 38, 38, 124, 124, 33, 40, 41, 35, 61, 62, 60, 34, 39, 42, 92, 44, 45, 69, 78, 68,
    95, 79, 70, 95, 80, 82, 79, 68, 85, 67, 84, 73, 79, 78, 70, 73, 76, 84, 69, 82, 102, 105, 108,
    116, 101, 114, 65, 83, 67, 69, 78, 68, 73, 78, 71, 97, 115, 99, 101, 110, 100, 105, 110, 103,
    79, 82, 111, 114, 78, 79, 84, 110, 111, 116, 83, 111, 114, 116, 115, 111, 114, 116, 67, 82, 69,
    65, 84, 69, 68, 99, 114, 101, 97, 116, 101, 100, 77, 79, 68, 73, 70, 73, 69, 68, 109, 111, 100,
    105, 102, 105, 101, 114, 116, 104, 114, 111, 117, 103, 104, 105, 115, 103, 114, 101, 97, 116,
    101, 114, 108, 101, 115, 115, 101, 114, 101, 113, 117, 97, 108, 115, 100, 101, 115, 99, 101,
    110, 100, 105, 110, 103, 68, 69, 83, 67, 69, 78, 68, 73, 78, 71, 117, 112, 84, 79, 70, 105,
    108, 116, 101, 114, 102, 114, 111, 109, 65, 78, 68, 97, 110, 100, 79, 114, 111, 110, 78, 111,
    116, 83, 79, 82, 84, 115, 105, 122, 101, 116, 104, 97, 116, 100, 97, 116, 101, 84, 111, 65,
    110, 100, 83, 73, 90, 69, 116, 104, 97, 110, 116, 111, 100, 111, 119, 110,
];

fn isTokenActive(token_id: i32, row: u32) -> bool {
    let index = ((row * 6) + (token_id >> 4) as u32) as usize;
    let shift: u16 = 1 << (15 & (token_id - 1));
    return (token_lookup[index] & shift) > 0;
}

fn scan_core(state: &mut ParserState, tk_row: u32) {
    match (state.get_byte_from_input(state.lexer.byte_offset) & 127) {
        33 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 33 {
                state.lexer.setToken(27, 1, 1);
                return;
            };
        }
        34 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 34 {
                state.lexer.setToken(66, 1, 1);
                return;
            };
        }
        35 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 35 {
                state.lexer.setToken(41, 1, 1);
                return;
            };
        }
        38 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 38 {
                if isTokenActive(16, tk_row)
                    && state.get_byte_from_input(state.lexer.byte_offset + 1) == 38
                {
                    state.lexer.setToken(16, 2, 2);
                    return;
                };
            };
        }
        39 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 39 {
                state.lexer.setToken(67, 1, 1);
                return;
            };
        }
        40 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 40 {
                state.lexer.setToken(28, 1, 1);
                return;
            };
        }
        41 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 41 {
                state.lexer.setToken(29, 1, 1);
                return;
            };
        }
        42 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 42 {
                state.lexer.setToken(68, 1, 1);
                return;
            };
        }
        44 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 44 {
                state.lexer.setToken(70, 1, 1);
                return;
            };
        }
        45 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 45 {
                state.lexer.setToken(73, 1, 1);
                return;
            };
        }
        47 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 47 {
                state.lexer.setToken(9, 1, 1);
                return;
            };
        }
        58 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 58 {
                state.lexer.setToken(11, 1, 1);
                return;
            };
        }
        60 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 60 {
                state.lexer.setToken(51, 1, 1);
                return;
            };
        }
        61 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 61 {
                state.lexer.setToken(47, 1, 1);
                return;
            };
        }
        62 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 62 {
                state.lexer.setToken(49, 1, 1);
                return;
            };
        }
        63 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 63 {
                state.lexer.setToken(12, 1, 1);
                return;
            };
        }
        65 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 65 {
                if state.get_byte_from_input(state.lexer.byte_offset + 1) == 83 {
                    if state.get_byte_from_input(state.lexer.byte_offset + 2) == 67 {
                        if state.get_byte_from_input(state.lexer.byte_offset + 3) == 69 {
                            if 5 == compare(
                                state,
                                state.lexer.byte_offset + 4,
                                53,
                                5,
                                &token_sequence_lookup,
                            ) {
                                if isTokenActive(65, tk_row)
                                    && token_production(state, hc_string_data, 23, 65, 1)
                                    && state.lexer.byte_length > 9
                                {
                                    return;
                                } else {
                                    if isTokenActive(3, tk_row)
                                        && state.lexer.isUniID(state.get_input_array())
                                        && state.lexer.byte_length > 9
                                    {
                                        return;
                                    } else {
                                        {
                                            state.lexer.setToken(63, 9, 9);
                                            return;
                                        }
                                    }
                                };
                            };
                        } else {
                            if isTokenActive(65, tk_row)
                                && token_production(state, hc_string_data, 23, 65, 1)
                                && state.lexer.byte_length > 3
                            {
                                return;
                            } else {
                                if isTokenActive(3, tk_row)
                                    && state.lexer.isUniID(state.get_input_array())
                                    && state.lexer.byte_length > 3
                                {
                                    return;
                                } else {
                                    {
                                        state.lexer.setToken(60, 3, 3);
                                        return;
                                    }
                                }
                            }
                        };
                    };
                } else {
                    if state.get_byte_from_input(state.lexer.byte_offset + 1) == 78 {
                        if state.get_byte_from_input(state.lexer.byte_offset + 2) == 68 {
                            if isTokenActive(65, tk_row)
                                && token_production(state, hc_string_data, 23, 65, 1)
                                && state.lexer.byte_length > 3
                            {
                                return;
                            } else {
                                if isTokenActive(3, tk_row)
                                    && state.lexer.isUniID(state.get_input_array())
                                    && state.lexer.byte_length > 3
                                {
                                    return;
                                } else {
                                    {
                                        state.lexer.setToken(17, 3, 3);
                                        return;
                                    }
                                }
                            };
                        };
                    } else {
                        if state.get_byte_from_input(state.lexer.byte_offset + 1) == 110 {
                            if state.get_byte_from_input(state.lexer.byte_offset + 2) == 100 {
                                if isTokenActive(65, tk_row)
                                    && token_production(state, hc_string_data, 23, 65, 1)
                                    && state.lexer.byte_length > 3
                                {
                                    return;
                                } else {
                                    if isTokenActive(3, tk_row)
                                        && state.lexer.isUniID(state.get_input_array())
                                        && state.lexer.byte_length > 3
                                    {
                                        return;
                                    } else {
                                        {
                                            state.lexer.setToken(18, 3, 3);
                                            return;
                                        }
                                    }
                                };
                            };
                        }
                    }
                };
            };
        }
        67 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 67 {
                if 6 == compare(
                    state,
                    state.lexer.byte_offset + 1,
                    86,
                    6,
                    &token_sequence_lookup,
                ) {
                    if isTokenActive(65, tk_row)
                        && token_production(state, hc_string_data, 23, 65, 1)
                        && state.lexer.byte_length > 7
                    {
                        return;
                    } else {
                        if isTokenActive(3, tk_row)
                            && state.lexer.isUniID(state.get_input_array())
                            && state.lexer.byte_length > 7
                        {
                            return;
                        } else {
                            {
                                state.lexer.setToken(35, 7, 7);
                                return;
                            }
                        }
                    };
                };
            };
        }
        68 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 68 {
                if 2 == compare(
                    state,
                    state.lexer.byte_offset + 1,
                    154,
                    2,
                    &token_sequence_lookup,
                ) {
                    if state.get_byte_from_input(state.lexer.byte_offset + 3) == 67 {
                        if 6 == compare(
                            state,
                            state.lexer.byte_offset + 4,
                            157,
                            6,
                            &token_sequence_lookup,
                        ) {
                            if isTokenActive(65, tk_row)
                                && token_production(state, hc_string_data, 23, 65, 1)
                                && state.lexer.byte_length > 10
                            {
                                return;
                            } else {
                                if isTokenActive(3, tk_row)
                                    && state.lexer.isUniID(state.get_input_array())
                                    && state.lexer.byte_length > 10
                                {
                                    return;
                                } else {
                                    {
                                        state.lexer.setToken(58, 10, 10);
                                        return;
                                    }
                                }
                            };
                        };
                    } else {
                        if isTokenActive(65, tk_row)
                            && token_production(state, hc_string_data, 23, 65, 1)
                            && state.lexer.byte_length > 3
                        {
                            return;
                        } else {
                            if isTokenActive(3, tk_row)
                                && state.lexer.isUniID(state.get_input_array())
                                && state.lexer.byte_length > 3
                            {
                                return;
                            } else {
                                {
                                    state.lexer.setToken(55, 3, 3);
                                    return;
                                }
                            }
                        }
                    };
                };
            };
        }
        70 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 70 {
                if state.get_byte_from_input(state.lexer.byte_offset + 1) == 73 {
                    if 4 == compare(
                        state,
                        state.lexer.byte_offset + 2,
                        39,
                        4,
                        &token_sequence_lookup,
                    ) {
                        if isTokenActive(65, tk_row)
                            && token_production(state, hc_string_data, 23, 65, 1)
                            && state.lexer.byte_length > 6
                        {
                            return;
                        } else {
                            if isTokenActive(3, tk_row)
                                && state.lexer.isUniID(state.get_input_array())
                                && state.lexer.byte_length > 6
                            {
                                return;
                            } else {
                                {
                                    state.lexer.setToken(10, 6, 6);
                                    return;
                                }
                            }
                        };
                    };
                } else {
                    if state.get_byte_from_input(state.lexer.byte_offset + 1) == 105 {
                        if 4 == compare(
                            state,
                            state.lexer.byte_offset + 2,
                            169,
                            4,
                            &token_sequence_lookup,
                        ) {
                            if isTokenActive(65, tk_row)
                                && token_production(state, hc_string_data, 23, 65, 1)
                                && state.lexer.byte_length > 6
                            {
                                return;
                            } else {
                                if isTokenActive(3, tk_row)
                                    && state.lexer.isUniID(state.get_input_array())
                                    && state.lexer.byte_length > 6
                                {
                                    return;
                                } else {
                                    {
                                        state.lexer.setToken(15, 6, 6);
                                        return;
                                    }
                                }
                            };
                        };
                    }
                };
            };
        }
        77 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 77 {
                if 7 == compare(
                    state,
                    state.lexer.byte_offset + 1,
                    100,
                    7,
                    &token_sequence_lookup,
                ) {
                    if isTokenActive(65, tk_row)
                        && token_production(state, hc_string_data, 23, 65, 1)
                        && state.lexer.byte_length > 8
                    {
                        return;
                    } else {
                        if isTokenActive(3, tk_row)
                            && state.lexer.isUniID(state.get_input_array())
                            && state.lexer.byte_length > 8
                        {
                            return;
                        } else {
                            {
                                state.lexer.setToken(37, 8, 8);
                                return;
                            }
                        }
                    };
                };
            };
        }
        78 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 78 {
                if state.get_byte_from_input(state.lexer.byte_offset + 1) == 79 {
                    if state.get_byte_from_input(state.lexer.byte_offset + 2) == 84 {
                        if isTokenActive(65, tk_row)
                            && token_production(state, hc_string_data, 23, 65, 1)
                            && state.lexer.byte_length > 3
                        {
                            return;
                        } else {
                            if isTokenActive(3, tk_row)
                                && state.lexer.isUniID(state.get_input_array())
                                && state.lexer.byte_length > 3
                            {
                                return;
                            } else {
                                {
                                    state.lexer.setToken(24, 3, 3);
                                    return;
                                }
                            }
                        };
                    };
                } else {
                    if state.get_byte_from_input(state.lexer.byte_offset + 1) == 111 {
                        if state.get_byte_from_input(state.lexer.byte_offset + 2) == 116 {
                            if isTokenActive(65, tk_row)
                                && token_production(state, hc_string_data, 23, 65, 1)
                                && state.lexer.byte_length > 3
                            {
                                return;
                            } else {
                                if isTokenActive(3, tk_row)
                                    && state.lexer.isUniID(state.get_input_array())
                                    && state.lexer.byte_length > 3
                                {
                                    return;
                                } else {
                                    {
                                        state.lexer.setToken(25, 3, 3);
                                        return;
                                    }
                                }
                            };
                        };
                    }
                };
            };
        }
        79 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 79 {
                if state.get_byte_from_input(state.lexer.byte_offset + 1) == 82 {
                    if isTokenActive(65, tk_row)
                        && token_production(state, hc_string_data, 23, 65, 1)
                        && state.lexer.byte_length > 2
                    {
                        return;
                    } else {
                        if isTokenActive(3, tk_row)
                            && state.lexer.isUniID(state.get_input_array())
                            && state.lexer.byte_length > 2
                        {
                            return;
                        } else {
                            {
                                state.lexer.setToken(21, 2, 2);
                                return;
                            }
                        }
                    };
                } else {
                    if state.get_byte_from_input(state.lexer.byte_offset + 1) == 114 {
                        if isTokenActive(65, tk_row)
                            && token_production(state, hc_string_data, 23, 65, 1)
                            && state.lexer.byte_length > 2
                        {
                            return;
                        } else {
                            if isTokenActive(3, tk_row)
                                && state.lexer.isUniID(state.get_input_array())
                                && state.lexer.byte_length > 2
                            {
                                return;
                            } else {
                                {
                                    state.lexer.setToken(22, 2, 2);
                                    return;
                                }
                            }
                        };
                    }
                };
            };
        }
        83 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 83 {
                if state.get_byte_from_input(state.lexer.byte_offset + 1) == 111 {
                    if 2 == compare(
                        state,
                        state.lexer.byte_offset + 2,
                        79,
                        2,
                        &token_sequence_lookup,
                    ) {
                        if isTokenActive(65, tk_row)
                            && token_production(state, hc_string_data, 23, 65, 1)
                            && state.lexer.byte_length > 4
                        {
                            return;
                        } else {
                            if isTokenActive(3, tk_row)
                                && state.lexer.isUniID(state.get_input_array())
                                && state.lexer.byte_length > 4
                            {
                                return;
                            } else {
                                {
                                    state.lexer.setToken(30, 4, 4);
                                    return;
                                }
                            }
                        };
                    };
                } else {
                    if state.get_byte_from_input(state.lexer.byte_offset + 1) == 79 {
                        if 2 == compare(
                            state,
                            state.lexer.byte_offset + 2,
                            192,
                            2,
                            &token_sequence_lookup,
                        ) {
                            if isTokenActive(65, tk_row)
                                && token_production(state, hc_string_data, 23, 65, 1)
                                && state.lexer.byte_length > 4
                            {
                                return;
                            } else {
                                if isTokenActive(3, tk_row)
                                    && state.lexer.isUniID(state.get_input_array())
                                    && state.lexer.byte_length > 4
                                {
                                    return;
                                } else {
                                    {
                                        state.lexer.setToken(34, 4, 4);
                                        return;
                                    }
                                }
                            };
                        };
                    } else {
                        if state.get_byte_from_input(state.lexer.byte_offset + 1) == 73 {
                            if 2 == compare(
                                state,
                                state.lexer.byte_offset + 2,
                                213,
                                2,
                                &token_sequence_lookup,
                            ) {
                                if isTokenActive(65, tk_row)
                                    && token_production(state, hc_string_data, 23, 65, 1)
                                    && state.lexer.byte_length > 4
                                {
                                    return;
                                } else {
                                    if isTokenActive(3, tk_row)
                                        && state.lexer.isUniID(state.get_input_array())
                                        && state.lexer.byte_length > 4
                                    {
                                        return;
                                    } else {
                                        {
                                            state.lexer.setToken(39, 4, 4);
                                            return;
                                        }
                                    }
                                };
                            };
                        }
                    }
                };
            };
        }
        84 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 84 {
                if state.get_byte_from_input(state.lexer.byte_offset + 1) == 79 {
                    if isTokenActive(65, tk_row)
                        && token_production(state, hc_string_data, 23, 65, 1)
                        && state.lexer.byte_length > 2
                    {
                        return;
                    } else {
                        if isTokenActive(3, tk_row)
                            && state.lexer.isUniID(state.get_input_array())
                            && state.lexer.byte_length > 2
                        {
                            return;
                        } else {
                            {
                                state.lexer.setToken(74, 2, 2);
                                return;
                            }
                        }
                    };
                } else {
                    if state.get_byte_from_input(state.lexer.byte_offset + 1) == 111 {
                        if isTokenActive(65, tk_row)
                            && token_production(state, hc_string_data, 23, 65, 1)
                            && state.lexer.byte_length > 2
                        {
                            return;
                        } else {
                            if isTokenActive(3, tk_row)
                                && state.lexer.isUniID(state.get_input_array())
                                && state.lexer.byte_length > 2
                            {
                                return;
                            } else {
                                {
                                    state.lexer.setToken(75, 2, 2);
                                    return;
                                }
                            }
                        };
                    }
                };
            };
        }
        92 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 92 {
                state.lexer.setToken(69, 1, 1);
                return;
            };
        }
        97 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 97 {
                if state.get_byte_from_input(state.lexer.byte_offset + 1) == 115 {
                    if state.get_byte_from_input(state.lexer.byte_offset + 2) == 99 {
                        if state.get_byte_from_input(state.lexer.byte_offset + 3) == 101 {
                            if 5 == compare(
                                state,
                                state.lexer.byte_offset + 4,
                                62,
                                5,
                                &token_sequence_lookup,
                            ) {
                                if isTokenActive(65, tk_row)
                                    && token_production(state, hc_string_data, 23, 65, 1)
                                    && state.lexer.byte_length > 9
                                {
                                    return;
                                } else {
                                    if isTokenActive(3, tk_row)
                                        && state.lexer.isUniID(state.get_input_array())
                                        && state.lexer.byte_length > 9
                                    {
                                        return;
                                    } else {
                                        {
                                            state.lexer.setToken(62, 9, 9);
                                            return;
                                        }
                                    }
                                };
                            };
                        } else {
                            if isTokenActive(65, tk_row)
                                && token_production(state, hc_string_data, 23, 65, 1)
                                && state.lexer.byte_length > 3
                            {
                                return;
                            } else {
                                if isTokenActive(3, tk_row)
                                    && state.lexer.isUniID(state.get_input_array())
                                    && state.lexer.byte_length > 3
                                {
                                    return;
                                } else {
                                    {
                                        state.lexer.setToken(61, 3, 3);
                                        return;
                                    }
                                }
                            }
                        };
                    };
                } else {
                    if state.get_byte_from_input(state.lexer.byte_offset + 1) == 110 {
                        if state.get_byte_from_input(state.lexer.byte_offset + 2) == 100 {
                            if isTokenActive(65, tk_row)
                                && token_production(state, hc_string_data, 23, 65, 1)
                                && state.lexer.byte_length > 3
                            {
                                return;
                            } else {
                                if isTokenActive(3, tk_row)
                                    && state.lexer.isUniID(state.get_input_array())
                                    && state.lexer.byte_length > 3
                                {
                                    return;
                                } else {
                                    {
                                        state.lexer.setToken(19, 3, 3);
                                        return;
                                    }
                                }
                            };
                        };
                    }
                };
            };
        }
        99 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 99 {
                if 6 == compare(
                    state,
                    state.lexer.byte_offset + 1,
                    93,
                    6,
                    &token_sequence_lookup,
                ) {
                    if isTokenActive(65, tk_row)
                        && token_production(state, hc_string_data, 23, 65, 1)
                        && state.lexer.byte_length > 7
                    {
                        return;
                    } else {
                        if isTokenActive(3, tk_row)
                            && state.lexer.isUniID(state.get_input_array())
                            && state.lexer.byte_length > 7
                        {
                            return;
                        } else {
                            {
                                state.lexer.setToken(36, 7, 7);
                                return;
                            }
                        }
                    };
                };
            };
        }
        100 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 100 {
                if state.get_byte_from_input(state.lexer.byte_offset + 1) == 101 {
                    if state.get_byte_from_input(state.lexer.byte_offset + 2) == 115 {
                        if state.get_byte_from_input(state.lexer.byte_offset + 3) == 99 {
                            if 6 == compare(
                                state,
                                state.lexer.byte_offset + 4,
                                147,
                                6,
                                &token_sequence_lookup,
                            ) {
                                if isTokenActive(65, tk_row)
                                    && token_production(state, hc_string_data, 23, 65, 1)
                                    && state.lexer.byte_length > 10
                                {
                                    return;
                                } else {
                                    if isTokenActive(3, tk_row)
                                        && state.lexer.isUniID(state.get_input_array())
                                        && state.lexer.byte_length > 10
                                    {
                                        return;
                                    } else {
                                        {
                                            state.lexer.setToken(57, 10, 10);
                                            return;
                                        }
                                    }
                                };
                            };
                        } else {
                            if isTokenActive(65, tk_row)
                                && token_production(state, hc_string_data, 23, 65, 1)
                                && state.lexer.byte_length > 3
                            {
                                return;
                            } else {
                                if isTokenActive(3, tk_row)
                                    && state.lexer.isUniID(state.get_input_array())
                                    && state.lexer.byte_length > 3
                                {
                                    return;
                                } else {
                                    {
                                        state.lexer.setToken(56, 3, 3);
                                        return;
                                    }
                                }
                            }
                        };
                    };
                } else {
                    if state.get_byte_from_input(state.lexer.byte_offset + 1) == 97 {
                        if 2 == compare(
                            state,
                            state.lexer.byte_offset + 2,
                            204,
                            2,
                            &token_sequence_lookup,
                        ) {
                            if isTokenActive(65, tk_row)
                                && token_production(state, hc_string_data, 23, 65, 1)
                                && state.lexer.byte_length > 4
                            {
                                return;
                            } else {
                                if isTokenActive(3, tk_row)
                                    && state.lexer.isUniID(state.get_input_array())
                                    && state.lexer.byte_length > 4
                                {
                                    return;
                                } else {
                                    {
                                        state.lexer.setToken(53, 4, 4);
                                        return;
                                    }
                                }
                            };
                        };
                    } else {
                        if state.get_byte_from_input(state.lexer.byte_offset + 1) == 111 {
                            if 2 == compare(
                                state,
                                state.lexer.byte_offset + 2,
                                223,
                                2,
                                &token_sequence_lookup,
                            ) {
                                if isTokenActive(65, tk_row)
                                    && token_production(state, hc_string_data, 23, 65, 1)
                                    && state.lexer.byte_length > 4
                                {
                                    return;
                                } else {
                                    if isTokenActive(3, tk_row)
                                        && state.lexer.isUniID(state.get_input_array())
                                        && state.lexer.byte_length > 4
                                    {
                                        return;
                                    } else {
                                        {
                                            state.lexer.setToken(59, 4, 4);
                                            return;
                                        }
                                    }
                                };
                            };
                        }
                    }
                };
            };
        }
        101 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 101 {
                if 5 == compare(
                    state,
                    state.lexer.byte_offset + 1,
                    138,
                    5,
                    &token_sequence_lookup,
                ) {
                    if isTokenActive(65, tk_row)
                        && token_production(state, hc_string_data, 23, 65, 1)
                        && state.lexer.byte_length > 6
                    {
                        return;
                    } else {
                        if isTokenActive(3, tk_row)
                            && state.lexer.isUniID(state.get_input_array())
                            && state.lexer.byte_length > 6
                        {
                            return;
                        } else {
                            {
                                state.lexer.setToken(46, 6, 6);
                                return;
                            }
                        }
                    };
                };
            };
        }
        102 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 102 {
                if state.get_byte_from_input(state.lexer.byte_offset + 1) == 105 {
                    if 4 == compare(
                        state,
                        state.lexer.byte_offset + 2,
                        45,
                        4,
                        &token_sequence_lookup,
                    ) {
                        if isTokenActive(65, tk_row)
                            && token_production(state, hc_string_data, 23, 65, 1)
                            && state.lexer.byte_length > 6
                        {
                            return;
                        } else {
                            if isTokenActive(3, tk_row)
                                && state.lexer.isUniID(state.get_input_array())
                                && state.lexer.byte_length > 6
                            {
                                return;
                            } else {
                                {
                                    state.lexer.setToken(14, 6, 6);
                                    return;
                                }
                            }
                        };
                    };
                } else {
                    if state.get_byte_from_input(state.lexer.byte_offset + 1) == 114 {
                        if 2 == compare(
                            state,
                            state.lexer.byte_offset + 2,
                            175,
                            2,
                            &token_sequence_lookup,
                        ) {
                            if isTokenActive(65, tk_row)
                                && token_production(state, hc_string_data, 23, 65, 1)
                                && state.lexer.byte_length > 4
                            {
                                return;
                            } else {
                                if isTokenActive(3, tk_row)
                                    && state.lexer.isUniID(state.get_input_array())
                                    && state.lexer.byte_length > 4
                                {
                                    return;
                                } else {
                                    {
                                        state.lexer.setToken(52, 4, 4);
                                        return;
                                    }
                                }
                            };
                        };
                    } else {
                        if isTokenActive(65, tk_row)
                            && token_production(state, hc_string_data, 23, 65, 1)
                            && state.lexer.byte_length > 1
                        {
                            return;
                        } else {
                            if isTokenActive(3, tk_row)
                                && state.lexer.isUniID(state.get_input_array())
                                && state.lexer.byte_length > 1
                            {
                                return;
                            } else {
                                {
                                    state.lexer.setToken(13, 1, 1);
                                    return;
                                }
                            }
                        }
                    }
                };
            };
        }
        103 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 103 {
                if 6 == compare(
                    state,
                    state.lexer.byte_offset + 1,
                    125,
                    6,
                    &token_sequence_lookup,
                ) {
                    if isTokenActive(65, tk_row)
                        && token_production(state, hc_string_data, 23, 65, 1)
                        && state.lexer.byte_length > 7
                    {
                        return;
                    } else {
                        if isTokenActive(3, tk_row)
                            && state.lexer.isUniID(state.get_input_array())
                            && state.lexer.byte_length > 7
                        {
                            return;
                        } else {
                            {
                                state.lexer.setToken(44, 7, 7);
                                return;
                            }
                        }
                    };
                };
            };
        }
        105 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 105 {
                if state.get_byte_from_input(state.lexer.byte_offset + 1) == 115 {
                    if isTokenActive(65, tk_row)
                        && token_production(state, hc_string_data, 23, 65, 1)
                        && state.lexer.byte_length > 2
                    {
                        return;
                    } else {
                        if isTokenActive(3, tk_row)
                            && state.lexer.isUniID(state.get_input_array())
                            && state.lexer.byte_length > 2
                        {
                            return;
                        } else {
                            {
                                state.lexer.setToken(43, 2, 2);
                                return;
                            }
                        }
                    };
                };
            };
        }
        108 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 108 {
                if 3 == compare(
                    state,
                    state.lexer.byte_offset + 1,
                    132,
                    3,
                    &token_sequence_lookup,
                ) {
                    if state.get_byte_from_input(state.lexer.byte_offset + 4) == 101 {
                        if state.get_byte_from_input(state.lexer.byte_offset + 5) == 114 {
                            if isTokenActive(65, tk_row)
                                && token_production(state, hc_string_data, 23, 65, 1)
                                && state.lexer.byte_length > 6
                            {
                                return;
                            } else {
                                if isTokenActive(3, tk_row)
                                    && state.lexer.isUniID(state.get_input_array())
                                    && state.lexer.byte_length > 6
                                {
                                    return;
                                } else {
                                    {
                                        state.lexer.setToken(45, 6, 6);
                                        return;
                                    }
                                }
                            };
                        };
                    } else {
                        if isTokenActive(65, tk_row)
                            && token_production(state, hc_string_data, 23, 65, 1)
                            && state.lexer.byte_length > 4
                        {
                            return;
                        } else {
                            if isTokenActive(3, tk_row)
                                && state.lexer.isUniID(state.get_input_array())
                                && state.lexer.byte_length > 4
                            {
                                return;
                            } else {
                                {
                                    state.lexer.setToken(50, 4, 4);
                                    return;
                                }
                            }
                        }
                    };
                };
            };
        }
        109 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 109 {
                if 7 == compare(
                    state,
                    state.lexer.byte_offset + 1,
                    108,
                    7,
                    &token_sequence_lookup,
                ) {
                    if isTokenActive(65, tk_row)
                        && token_production(state, hc_string_data, 23, 65, 1)
                        && state.lexer.byte_length > 8
                    {
                        return;
                    } else {
                        if isTokenActive(3, tk_row)
                            && state.lexer.isUniID(state.get_input_array())
                            && state.lexer.byte_length > 8
                        {
                            return;
                        } else {
                            {
                                state.lexer.setToken(38, 8, 8);
                                return;
                            }
                        }
                    };
                };
            };
        }
        110 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 110 {
                if 2 == compare(
                    state,
                    state.lexer.byte_offset + 1,
                    75,
                    2,
                    &token_sequence_lookup,
                ) {
                    if isTokenActive(65, tk_row)
                        && token_production(state, hc_string_data, 23, 65, 1)
                        && state.lexer.byte_length > 3
                    {
                        return;
                    } else {
                        if isTokenActive(3, tk_row)
                            && state.lexer.isUniID(state.get_input_array())
                            && state.lexer.byte_length > 3
                        {
                            return;
                        } else {
                            {
                                state.lexer.setToken(26, 3, 3);
                                return;
                            }
                        }
                    };
                };
            };
        }
        111 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 111 {
                if state.get_byte_from_input(state.lexer.byte_offset + 1) == 114 {
                    if isTokenActive(65, tk_row)
                        && token_production(state, hc_string_data, 23, 65, 1)
                        && state.lexer.byte_length > 2
                    {
                        return;
                    } else {
                        if isTokenActive(3, tk_row)
                            && state.lexer.isUniID(state.get_input_array())
                            && state.lexer.byte_length > 2
                        {
                            return;
                        } else {
                            {
                                state.lexer.setToken(23, 2, 2);
                                return;
                            }
                        }
                    };
                } else {
                    if state.get_byte_from_input(state.lexer.byte_offset + 1) == 110 {
                        if isTokenActive(65, tk_row)
                            && token_production(state, hc_string_data, 23, 65, 1)
                            && state.lexer.byte_length > 2
                        {
                            return;
                        } else {
                            if isTokenActive(3, tk_row)
                                && state.lexer.isUniID(state.get_input_array())
                                && state.lexer.byte_length > 2
                            {
                                return;
                            } else {
                                {
                                    state.lexer.setToken(54, 2, 2);
                                    return;
                                }
                            }
                        };
                    }
                };
            };
        }
        115 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 115 {
                if state.get_byte_from_input(state.lexer.byte_offset + 1) == 111 {
                    if 2 == compare(
                        state,
                        state.lexer.byte_offset + 2,
                        83,
                        2,
                        &token_sequence_lookup,
                    ) {
                        if isTokenActive(65, tk_row)
                            && token_production(state, hc_string_data, 23, 65, 1)
                            && state.lexer.byte_length > 4
                        {
                            return;
                        } else {
                            if isTokenActive(3, tk_row)
                                && state.lexer.isUniID(state.get_input_array())
                                && state.lexer.byte_length > 4
                            {
                                return;
                            } else {
                                {
                                    state.lexer.setToken(33, 4, 4);
                                    return;
                                }
                            }
                        };
                    };
                } else {
                    if state.get_byte_from_input(state.lexer.byte_offset + 1) == 105 {
                        if 2 == compare(
                            state,
                            state.lexer.byte_offset + 2,
                            196,
                            2,
                            &token_sequence_lookup,
                        ) {
                            if isTokenActive(65, tk_row)
                                && token_production(state, hc_string_data, 23, 65, 1)
                                && state.lexer.byte_length > 4
                            {
                                return;
                            } else {
                                if isTokenActive(3, tk_row)
                                    && state.lexer.isUniID(state.get_input_array())
                                    && state.lexer.byte_length > 4
                                {
                                    return;
                                } else {
                                    {
                                        state.lexer.setToken(40, 4, 4);
                                        return;
                                    }
                                }
                            };
                        };
                    } else {
                        if isTokenActive(65, tk_row)
                            && token_production(state, hc_string_data, 23, 65, 1)
                            && state.lexer.byte_length > 1
                        {
                            return;
                        } else {
                            if isTokenActive(3, tk_row)
                                && state.lexer.isUniID(state.get_input_array())
                                && state.lexer.byte_length > 1
                            {
                                return;
                            } else {
                                {
                                    state.lexer.setToken(32, 1, 1);
                                    return;
                                }
                            }
                        }
                    }
                };
            };
        }
        116 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 116 {
                if state.get_byte_from_input(state.lexer.byte_offset + 1) == 104 {
                    if state.get_byte_from_input(state.lexer.byte_offset + 2) == 114 {
                        if 4 == compare(
                            state,
                            state.lexer.byte_offset + 3,
                            118,
                            4,
                            &token_sequence_lookup,
                        ) {
                            if isTokenActive(65, tk_row)
                                && token_production(state, hc_string_data, 23, 65, 1)
                                && state.lexer.byte_length > 7
                            {
                                return;
                            } else {
                                if isTokenActive(3, tk_row)
                                    && state.lexer.isUniID(state.get_input_array())
                                    && state.lexer.byte_length > 7
                                {
                                    return;
                                } else {
                                    {
                                        state.lexer.setToken(71, 7, 7);
                                        return;
                                    }
                                }
                            };
                        };
                    } else {
                        if state.get_byte_from_input(state.lexer.byte_offset + 2) == 97 {
                            if state.get_byte_from_input(state.lexer.byte_offset + 3) == 116 {
                                if isTokenActive(65, tk_row)
                                    && token_production(state, hc_string_data, 23, 65, 1)
                                    && state.lexer.byte_length > 4
                                {
                                    return;
                                } else {
                                    if isTokenActive(3, tk_row)
                                        && state.lexer.isUniID(state.get_input_array())
                                        && state.lexer.byte_length > 4
                                    {
                                        return;
                                    } else {
                                        {
                                            state.lexer.setToken(42, 4, 4);
                                            return;
                                        }
                                    }
                                };
                            } else {
                                if state.get_byte_from_input(state.lexer.byte_offset + 3) == 110 {
                                    if isTokenActive(65, tk_row)
                                        && token_production(state, hc_string_data, 23, 65, 1)
                                        && state.lexer.byte_length > 4
                                    {
                                        return;
                                    } else {
                                        if isTokenActive(3, tk_row)
                                            && state.lexer.isUniID(state.get_input_array())
                                            && state.lexer.byte_length > 4
                                        {
                                            return;
                                        } else {
                                            {
                                                state.lexer.setToken(48, 4, 4);
                                                return;
                                            }
                                        }
                                    };
                                }
                            };
                        }
                    };
                } else {
                    if state.get_byte_from_input(state.lexer.byte_offset + 1) == 111 {
                        if isTokenActive(65, tk_row)
                            && token_production(state, hc_string_data, 23, 65, 1)
                            && state.lexer.byte_length > 2
                        {
                            return;
                        } else {
                            if isTokenActive(3, tk_row)
                                && state.lexer.isUniID(state.get_input_array())
                                && state.lexer.byte_length > 2
                            {
                                return;
                            } else {
                                {
                                    state.lexer.setToken(72, 2, 2);
                                    return;
                                }
                            }
                        };
                    }
                };
            };
        }
        117 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 117 {
                if state.get_byte_from_input(state.lexer.byte_offset + 1) == 112 {
                    if isTokenActive(65, tk_row)
                        && token_production(state, hc_string_data, 23, 65, 1)
                        && state.lexer.byte_length > 2
                    {
                        return;
                    } else {
                        if isTokenActive(3, tk_row)
                            && state.lexer.isUniID(state.get_input_array())
                            && state.lexer.byte_length > 2
                        {
                            return;
                        } else {
                            {
                                state.lexer.setToken(64, 2, 2);
                                return;
                            }
                        }
                    };
                };
            };
        }
        124 => {
            if state.get_byte_from_input(state.lexer.byte_offset) == 124 {
                if state.get_byte_from_input(state.lexer.byte_offset + 1) == 124 {
                    state.lexer.setToken(20, 2, 2);
                    return;
                } else {
                    {
                        state.lexer.setToken(31, 1, 1);
                        return;
                    }
                };
            };
        }
        _ => (),
    };
    if isTokenActive(65, tk_row)
        && pre_scan(state, 0)
        && token_production(state, hc_string_data, 23, 65, 1)
    {
        return;
    } else {
        if isTokenActive(8, tk_row) && state.lexer.isSP(true) {
            return;
        } else {
            if isTokenActive(3, tk_row) && state.lexer.isUniID(state.get_input_array()) {
                return;
            } else {
                if isTokenActive(2, tk_row) && state.lexer.isSym(state.get_input_array(), true) {
                    return;
                } else {
                    if isTokenActive(7, tk_row) && state.lexer.isNL() {
                        return;
                    } else {
                        if isTokenActive(5, tk_row) && state.lexer.isNum(state.get_input_array()) {
                            return;
                        }
                    }
                }
            }
        }
    };
}

fn scan(state: &mut ParserState, tk_row: u32, pk_row: u32) {
    if ((state.lexer._type) <= 0) {
        scan_core(state, tk_row)
    };
    if (pk_row > 0 && isTokenActive(state.lexer._type, pk_row)) {
        let offset: u32 = state.lexer.token_offset;
        while (isTokenActive(state.lexer._type, pk_row)) {
            state.lexer.next(state.get_input_array());
            scan_core(state, tk_row);
        }
        if (isOutputEnabled(state.state)) {
            add_skip(state, state.lexer.token_offset - offset)
        };
    };
}
fn pre_scan(state: &mut ParserState, tk_row: u32) -> bool {
    let tk_length: u16 = state.lexer.token_length;
    let bt_length: u16 = state.lexer.byte_length;
    scan(state, tk_row, 0);
    let type_cache: i32 = state.lexer._type;
    state.lexer._type = 0;
    state.lexer.token_length = tk_length;
    state.lexer.byte_length = bt_length;
    return type_cache > 0;
}

fn branch_046f073da918dca6(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return 28;
}

fn branch_0912092e7d3508ca(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 3, 53);
    return 0;
}

fn branch_0a7e6d784e387e5a(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 2, 47);
    return 18;
}

fn branch_10aef1dcb163497c(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 3, 36);
    return 0;
}

fn branch_114e869560771420(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    scan(state, 1, 2);
    if isTokenActive(state.lexer._type, 3) {
        consume(state);
        state.push_fn(branch_a360652d3e2f050d, state.get_rules_ptr_val());
        return hc_or_expression(state, db, state.get_rules_ptr_val());
    } else {
        {
            return 7;
        }
    };
    return -1;
}

fn branch_16fdf8b400e1b22b(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return hc_string_data_list_210_goto(state, db, 33);
}

fn branch_1891e5ab512e05c6(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return 25;
}

fn branch_1e531f1f51944026(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return 1;
}

fn branch_25ba0f0508015b00(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return 8;
}

fn branch_2a9cfc2dcbe580d4(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    state.push_fn(branch_d54fd4d396ca8546, state.get_rules_ptr_val());
    return hc_identifier(state, db, state.get_rules_ptr_val());
}

fn branch_2b8c5360b0e93b5a(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    scan(state, 4, 2);
    if isTokenActive(state.lexer._type, 5) {
        state.push_fn(branch_3b12b581fadac5eb, 15);
        state.push_fn(branch_730fe4b5fcaa5c26, state.get_rules_ptr_val());
        return hc_order(state, db, state.get_rules_ptr_val());
    } else {
        {
            add_reduce(state, 3, 33);
            return 15;
        }
    };
    return -1;
}

fn branch_321cf8c8907be6d4(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 2, 26);
    return 0;
}

fn branch_32de5a6e2d571354(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    state.push_fn(branch_37b926e37803c454, state.get_rules_ptr_val());
    return hc_order(state, db, state.get_rules_ptr_val());
}

fn branch_34ef0f5aa4254d09(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    scan(state, 4, 2);
    if isTokenActive(state.lexer._type, 5) {
        state.push_fn(branch_e28f297a41189e8a, 13);
        state.push_fn(branch_508f0dae471f80f9, state.get_rules_ptr_val());
        return hc_order(state, db, state.get_rules_ptr_val());
    } else {
        {
            add_reduce(state, 2, 27);
            return 13;
        }
    };
    return -1;
}

fn branch_3556e1fd2dfb32ff(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return prod;
}

fn branch_35e17ca21e7355a9(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 3, 0);
    return 0;
}

fn branch_35e9ba8b4eafc319(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    state.push_fn(branch_d161341584173c93, state.get_rules_ptr_val());
    return hc_order(state, db, state.get_rules_ptr_val());
}

fn branch_362d716434dc4a2f(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    scan(state, 4, 2);
    if isTokenActive(state.lexer._type, 5) {
        state.push_fn(branch_414f7966dbafeb4a, 14);
        state.push_fn(branch_b729f3efa69861ef, state.get_rules_ptr_val());
        return hc_order(state, db, state.get_rules_ptr_val());
    } else {
        {
            add_reduce(state, 2, 30);
            return 14;
        }
    };
    return -1;
}

fn branch_375c5bc2571255b7(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 3, 46);
    return 18;
}

fn branch_37b926e37803c454(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 3, 32);
    return 15;
}

fn branch_39faa76b84957c22(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 1, 51);
    return 0;
}

fn branch_3b12b581fadac5eb(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return 15;
}

fn branch_3ceb3b8dbd024280(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    scan(state, 6, 2);
    if state.lexer._type == 5 {
        consume(state);
        scan(state, 7, 2);
        if (isTokenActive(state.lexer._type, 8)) {
            state.push_fn(branch_375c5bc2571255b7, state.get_rules_ptr_val());
            return hc_date_expression_group_163_0_(state, db, state.get_rules_ptr_val());
        };
    };
    return -1;
}

fn branch_414f7966dbafeb4a(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return 14;
}

fn branch_416ff695044d74db(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 2, 52);
    return hc_container_clause_goto(state, db, 28);
}

fn branch_43a8da60c5314938(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return 10;
}

fn branch_449740ceb8df7fb1(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 2, 2);
    return 0;
}

fn branch_486d59aae6314cef(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    scan(state, 9, 2);
    if isTokenActive(state.lexer._type, 10) {
        state.push_fn(branch_7fb84c021810420c, 2);
        state.push_fn(branch_449740ceb8df7fb1, state.get_rules_ptr_val());
        return hc_sort_clause(state, db, state.get_rules_ptr_val());
    } else {
        {
            add_reduce(state, 1, 6);
            return 2;
        }
    };
    return -1;
}

fn branch_48f8f4c4435be74e(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 2, 22);
    return 12;
}

fn branch_4ec0d704b96d7b91(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    scan(state, 6, 2);
    if state.lexer._type == 5 {
        consume(state);
        add_reduce(state, 2, 16);
        return 31;
    };
    return -1;
}

fn branch_4f3f36114e273f49(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return 31;
}

fn branch_4fb73788d1fe626a(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 1, 51);
    return hc_container_clause_list_6_goto(state, db, 28);
}

fn branch_508f0dae471f80f9(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 3, 25);
    return 0;
}

fn branch_5242960545d4416e(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 1, 51);
    return hc_identifier_list_200_goto(state, db, 32);
}

fn branch_54c6214b083ed3d4(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 2, 16);
    return 0;
}

fn branch_55f055cf6269a4fe(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    state.push_fn(branch_0a7e6d784e387e5a, state.get_rules_ptr_val());
    return hc_string_data(state, db, state.get_rules_ptr_val());
}

fn branch_58a70e7a743ce1a8(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 2, 40);
    return 0;
}

fn branch_590986bd38c8040a(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 1, 5);
    return 0;
}

fn branch_5ccd1d9a04b4fbc7(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return 21;
}

fn branch_612fae9e544dec3a(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    scan(state, 11, 2);
    if (state.lexer._type == 29) {
        consume(state);
        add_reduce(state, 3, 16);
        return 0;
    };
    return -1;
}

fn branch_68e59d89a6ad6781(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 2, 9);
    return hc_container_clause_goto(state, db, 3);
}

fn branch_6ce09c86bc08060d(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return 5;
}

fn branch_6d7b70428bd2cd9e(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 3, 21);
    return 0;
}

fn branch_730fe4b5fcaa5c26(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 4, 31);
    return 0;
}

fn branch_7ce5627ee252d91f(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    scan(state, 12, 2);
    state.push_fn(branch_ca6771573d9e527f, state.get_rules_ptr_val());
    return hc_container_clause_list_6(state, db, state.get_rules_ptr_val());
}

fn branch_7eba3295517f0c19(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    scan(state, 13, 2);
    if (state.lexer._type == 9) {
        consume(state);
        add_reduce(state, 2, 14);
        return 4;
    };
    return -1;
}

fn branch_7f3f6d5915644f09(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    scan(state, 14, 2);
    if isTokenActive(state.lexer._type, 15) {
        consume(state);
        state.push_fn(branch_d2152fccc6d19cf3, state.get_rules_ptr_val());
        return hc_and_expression(state, db, state.get_rules_ptr_val());
    } else {
        {
            return 6;
        }
    };
    return -1;
}

fn branch_7fb84c021810420c(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return 2;
}

fn branch_801d9e42aeeb799a(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return 0;
}

fn branch_8118c1774fdfffd3(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 3, 15);
    return 0;
}

fn branch_8498e7b18db31ad9(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return 12;
}

fn branch_888b52b8871ccdb3(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return 9;
}

fn branch_8b15013bc34161b4(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return 11;
}

fn branch_8ba061fad6ecdb02(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return 16;
}

fn branch_8d085c7331d0f87b(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    scan(state, 16, 2);
    state.push_fn(branch_34ef0f5aa4254d09, state.get_rules_ptr_val());
    return hc_comparison_expression(state, db, state.get_rules_ptr_val());
}

fn branch_8fadd9dd6de0ad4f(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    state.push_fn(branch_9700eefe7d88d679, state.get_rules_ptr_val());
    return hc_string_data(state, db, state.get_rules_ptr_val());
}

fn branch_8fecb981d042a9c7(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    scan(state, 17, 2);
    if isTokenActive(state.lexer._type, 18) {
        state.push_fn(branch_3b12b581fadac5eb, 15);
        state.push_fn(branch_d27bc80eff49d685, state.get_rules_ptr_val());
        return hc_order(state, db, state.get_rules_ptr_val());
    } else {
        if isTokenActive(state.lexer._type, 19) {
            scan(state, 16, 2);
            state.push_fn(branch_2b8c5360b0e93b5a, state.get_rules_ptr_val());
            return hc_comparison_expression(state, db, state.get_rules_ptr_val());
        } else {
            if state.lexer._type == 49 || state.lexer._type == 51 {
                let fk1: &mut ParserState = fork(state, db);
                fk1.push_fn(branch_ce485ce64be3ce92, 0);
                state.push_fn(branch_32de5a6e2d571354, 0);
                return 0;
            } else {
                {
                    add_reduce(state, 2, 34);
                    return 15;
                }
            }
        }
    };
    return -1;
}

fn branch_96424dfede1a8bc9(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return 23;
}

fn branch_9700eefe7d88d679(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    state.push_fn(branch_375c5bc2571255b7, state.get_rules_ptr_val());
    return hc_date_expression_group_163_0_(state, db, state.get_rules_ptr_val());
}

fn branch_9a2a194ba6000915(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 3, 8);
    return 0;
}

fn branch_9d492d288a320a38(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return 17;
}

fn branch_9ff46550de479abc(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 1, 51);
    return hc_string_data_list_210_goto(state, db, 33);
}

fn branch_a360652d3e2f050d(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 3, 18);
    return 7;
}

fn branch_a5c360a587145794(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    scan(state, 4, 2);
    if isTokenActive(state.lexer._type, 5) {
        state.push_fn(branch_8498e7b18db31ad9, 12);
        state.push_fn(branch_6d7b70428bd2cd9e, state.get_rules_ptr_val());
        return hc_order(state, db, state.get_rules_ptr_val());
    } else {
        {
            add_reduce(state, 2, 23);
            return 12;
        }
    };
    return -1;
}

fn branch_a89d6a9cb6db8bfe(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 2, 19);
    return 8;
}

fn branch_aed11ff2ecc03e7f(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return 18;
}

fn branch_b1ca164f67ec8dda(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    state.push_fn(branch_416ff695044d74db, state.get_rules_ptr_val());
    return hc_container_identifier(state, db, state.get_rules_ptr_val());
}

fn branch_b6dd2507bc197b7a(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    scan(state, 16, 2);
    state.push_fn(branch_a5c360a587145794, state.get_rules_ptr_val());
    return hc_comparison_expression(state, db, state.get_rules_ptr_val());
}

fn branch_b729f3efa69861ef(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 3, 29);
    return 0;
}

fn branch_baa02ecb9d77dd49(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    state.push_fn(branch_d551d95371e32959, state.get_rules_ptr_val());
    return hc_string_data(state, db, state.get_rules_ptr_val());
}

fn branch_beb9a9d8bd8b632c(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    state.push_fn(branch_48f8f4c4435be74e, state.get_rules_ptr_val());
    return hc_order(state, db, state.get_rules_ptr_val());
}

fn branch_c211ddbd073f9a38(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    scan(state, 20, 21);
    if isTokenActive(state.lexer._type, 22) {
        state.push_fn(branch_96424dfede1a8bc9, 23);
        state.push_fn(branch_c417a0113f98071e, state.get_rules_ptr_val());
        return hc_string_data_list_210(state, db, state.get_rules_ptr_val());
    } else {
        {
            return 23;
        }
    };
    return -1;
}

fn branch_c417a0113f98071e(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 2, 0);
    return 0;
}

fn branch_c4202d648de08028(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return hc_container_clause_goto(state, db, 28);
}

fn branch_c984051a005e230c(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 2, 52);
    return hc_container_clause_list_6_goto(state, db, 28);
}

fn branch_c9efa60adecbbfd9(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    scan(state, 9, 2);
    if isTokenActive(state.lexer._type, 10) {
        state.push_fn(branch_7fb84c021810420c, 2);
        state.push_fn(branch_eb984fa773e98404, state.get_rules_ptr_val());
        return hc_sort_clause(state, db, state.get_rules_ptr_val());
    } else {
        {
            add_reduce(state, 2, 4);
            return 2;
        }
    };
    return -1;
}

fn branch_ca6771573d9e527f(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    scan(state, 23, 2);
    if state.lexer._type == 65 || state.lexer._type == 68 {
        state.push_fn(branch_d48622ce4bcbccfe, 3);
        state.push_fn(branch_9a2a194ba6000915, state.get_rules_ptr_val());
        return hc_identifier(state, db, state.get_rules_ptr_val());
    } else {
        {
            add_reduce(state, 2, 11);
            return hc_container_clause_goto(state, db, 3);
        }
    };
    return -1;
}

fn branch_cc128c520e06c5d9(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    state.push_fn(branch_68e59d89a6ad6781, state.get_rules_ptr_val());
    return hc_identifier(state, db, state.get_rules_ptr_val());
}

fn branch_ce485ce64be3ce92(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    scan(state, 16, 2);
    state.push_fn(branch_2b8c5360b0e93b5a, state.get_rules_ptr_val());
    return hc_comparison_expression(state, db, state.get_rules_ptr_val());
}

fn branch_d161341584173c93(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 2, 26);
    return 13;
}

fn branch_d173a16c864a526b(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 2, 3);
    return 0;
}

fn branch_d17876edfcf7e4d4(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 2, 52);
    return 0;
}

fn branch_d2152fccc6d19cf3(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 3, 17);
    return 6;
}

fn branch_d27bc80eff49d685(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 3, 32);
    return 0;
}

fn branch_d3da4f004e951e4a(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 2, 0);
    return 26;
}

fn branch_d48622ce4bcbccfe(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return hc_container_clause_goto(state, db, 3);
}

fn branch_d54fd4d396ca8546(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 2, 10);
    return hc_container_clause_goto(state, db, 3);
}

fn branch_d551d95371e32959(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 2, 16);
    return 31;
}

fn branch_d63d3ec8bde71654(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 1, 20);
    return 0;
}

fn branch_d95c53e16e6a00ca(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 1, 51);
    return hc_sort_clause_list_69_goto(state, db, 29);
}

fn branch_dcc14dfd9901ab2c(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    scan(state, 6, 2);
    if state.lexer._type == 5 {
        consume(state);
        add_reduce(state, 2, 47);
        return 18;
    };
    return -1;
}

fn branch_dd0d4861991a0119(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 2, 22);
    return 0;
}

fn branch_ddab4016b452cba1(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    scan(state, 24, 2);
    if isTokenActive(state.lexer._type, 8) {
        state.push_fn(branch_aed11ff2ecc03e7f, 18);
        state.push_fn(branch_f7e8d25cba8a7cd1, state.get_rules_ptr_val());
        return hc_date_expression_group_163_0_(state, db, state.get_rules_ptr_val());
    } else {
        {
            add_reduce(state, 2, 47);
            return 18;
        }
    };
    return -1;
}

fn branch_df7bb3e757be2738(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return hc_container_clause_goto(state, db, 32);
}

fn branch_e28f297a41189e8a(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return 13;
}

fn branch_e77a6e4869683f1a(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 1, 50);
    return 20;
}

fn branch_e85dedf30b7981e1(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return hc_sort_clause_list_69_goto(state, db, 29);
}

fn branch_eaf3fd46e8aaa8eb(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    scan(state, 25, 2);
    if isTokenActive(state.lexer._type, 26) {
        scan(state, 27, 2);
        state.push_fn(branch_c9efa60adecbbfd9, state.get_rules_ptr_val());
        return hc_filter_clause(state, db, state.get_rules_ptr_val());
    } else {
        if isTokenActive(state.lexer._type, 10) {
            state.push_fn(branch_7fb84c021810420c, 2);
            state.push_fn(branch_d173a16c864a526b, state.get_rules_ptr_val());
            return hc_sort_clause(state, db, state.get_rules_ptr_val());
        } else {
            {
                add_reduce(state, 1, 7);
                return 2;
            }
        }
    };
    return -1;
}

fn branch_eb984fa773e98404(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 3, 1);
    return 0;
}

fn branch_ef1348ecf1abe6e5(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    state.push_fn(branch_c984051a005e230c, state.get_rules_ptr_val());
    return hc_container_identifier(state, db, state.get_rules_ptr_val());
}

fn branch_f7367ead60daa727(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    return hc_identifier_list_200_goto(state, db, 32);
}

fn branch_f7e8d25cba8a7cd1(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 3, 46);
    return 0;
}

fn branch_f8a3663a4a4d8c1f(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    add_reduce(state, 3, 45);
    return 0;
}

pub fn hc_RNQL(state: &mut ParserState, db: &mut ParserStateBuffer, prod: i32) -> i32 {
    state.push_fn(branch_801d9e42aeeb799a, state.get_rules_ptr_val());
    return hc_start(state, db, state.get_rules_ptr_val());
}

pub fn hc_start(state: &mut ParserState, db: &mut ParserStateBuffer, prod: i32) -> i32 {
    state.push_fn(branch_1e531f1f51944026, state.get_rules_ptr_val());
    return hc_query_body(state, db, state.get_rules_ptr_val());
}

pub fn hc_query_body(state: &mut ParserState, db: &mut ParserStateBuffer, prod: i32) -> i32 {
    scan(state, 28, 2);
    if isTokenActive(state.lexer._type, 26) {
        scan(state, 27, 2);
        state.push_fn(branch_486d59aae6314cef, state.get_rules_ptr_val());
        return hc_filter_clause(state, db, state.get_rules_ptr_val());
    } else {
        if isTokenActive(state.lexer._type, 10) {
            state.push_fn(branch_7fb84c021810420c, 2);
            state.push_fn(branch_590986bd38c8040a, state.get_rules_ptr_val());
            return hc_sort_clause(state, db, state.get_rules_ptr_val());
        } else {
            {
                scan(state, 29, 2);
                state.push_fn(branch_eaf3fd46e8aaa8eb, state.get_rules_ptr_val());
                return hc_container_clause(state, db, state.get_rules_ptr_val());
            }
        }
    };
    return -1;
}

pub fn hc_container_clause(state: &mut ParserState, db: &mut ParserStateBuffer, prod: i32) -> i32 {
    scan(state, 29, 2);
    if state.lexer._type == 9 {
        consume(state);
        scan(state, 12, 2);
        if state.lexer._type == 65 || state.lexer._type == 68 {
            let fk1: &mut ParserState = fork(state, db);
            fk1.push_fn(branch_7ce5627ee252d91f, 0);
            state.push_fn(branch_2a9cfc2dcbe580d4, 0);
            return 0;
        };
    } else {
        if state.lexer._type == 65 || state.lexer._type == 68 {
            scan(state, 12, 2);
            if state.lexer._type == 68 {
                state.push_fn(branch_df7bb3e757be2738, 32);
                state.push_fn(branch_39faa76b84957c22, 0);
                return hc_wild_card(state, db, prod);
            } else {
                if state.lexer._type == 65 {
                    state.push_fn(branch_df7bb3e757be2738, 32);
                    state.push_fn(branch_39faa76b84957c22, 0);
                    return hc_identifier_part(state, db, prod);
                }
            };
        }
    };
    return -1;
}

pub fn hc_container_clause_goto(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    loop {
        match (prod) {
            20 => {
                scan(state, 25, 2);
                if state.lexer._type == 9 {
                    state.push_fn(branch_c4202d648de08028, 28);
                    consume(state);
                    add_reduce(state, 2, 14);
                    add_reduce(state, 1, 51);
                    return 0;
                } else {
                    {
                        add_reduce(state, 1, 12);
                        return 3;
                    }
                };
                break;
            }
            28 => {
                scan(state, 23, 2);
                if state.lexer._type == 65 || state.lexer._type == 68 {
                    let fk1: &mut ParserState = fork(state, db);
                    fk1.push_fn(branch_cc128c520e06c5d9, 0);
                    state.push_fn(branch_b1ca164f67ec8dda, 0);
                    return 0;
                } else {
                    {
                        add_reduce(state, 1, 13);
                        return 3;
                    }
                };
                break;
            }
            32 => {
                scan(state, 30, 2);
                if state.lexer._type == 65 || state.lexer._type == 68 {
                    state.push_fn(branch_df7bb3e757be2738, 32);
                    state.push_fn(branch_d17876edfcf7e4d4, state.get_rules_ptr_val());
                    return hc_identifier_part(state, db, state.get_rules_ptr_val());
                } else {
                    {
                        add_reduce(state, 1, 50);
                        prod = 20;
                        continue;
                    }
                };
                break;
            }
            _ => (),
        };
        break;
    }
    return if (prod == 3) { prod } else { -1 };
}

pub fn hc_container_identifier(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    prod: i32,
) -> i32 {
    state.push_fn(branch_7eba3295517f0c19, state.get_rules_ptr_val());
    return hc_identifier(state, db, state.get_rules_ptr_val());
}

pub fn hc_filter_clause(state: &mut ParserState, db: &mut ParserStateBuffer, prod: i32) -> i32 {
    scan(state, 27, 2);
    if isTokenActive(state.lexer._type, 31) {
        consume(state);
        scan(state, 32, 2);
        if isTokenActive(state.lexer._type, 33) {
            state.push_fn(branch_6ce09c86bc08060d, 5);
            state.push_fn(branch_54c6214b083ed3d4, state.get_rules_ptr_val());
            return hc_and_expression(state, db, state.get_rules_ptr_val());
        } else {
            if state.lexer._type == 11 {
                state.push_fn(branch_6ce09c86bc08060d, 5);
                consume(state);
                state.push_fn(branch_8118c1774fdfffd3, state.get_rules_ptr_val());
                return hc_and_expression(state, db, state.get_rules_ptr_val());
            }
        };
    } else {
        if state.lexer._type == 15 {
            state.push_fn(branch_6ce09c86bc08060d, 5);
            consume(state);
            state.push_fn(branch_54c6214b083ed3d4, state.get_rules_ptr_val());
            return hc_and_expression(state, db, state.get_rules_ptr_val());
        }
    };
    return -1;
}

pub fn hc_and_expression(state: &mut ParserState, db: &mut ParserStateBuffer, prod: i32) -> i32 {
    state.push_fn(branch_7f3f6d5915644f09, state.get_rules_ptr_val());
    return hc_or_expression(state, db, state.get_rules_ptr_val());
}

pub fn hc_or_expression(state: &mut ParserState, db: &mut ParserStateBuffer, prod: i32) -> i32 {
    state.push_fn(branch_114e869560771420, state.get_rules_ptr_val());
    return hc_not_expression(state, db, state.get_rules_ptr_val());
}

pub fn hc_not_expression(state: &mut ParserState, db: &mut ParserStateBuffer, prod: i32) -> i32 {
    scan(state, 34, 2);
    if isTokenActive(state.lexer._type, 35) {
        state.push_fn(branch_25ba0f0508015b00, 8);
        state.push_fn(branch_801d9e42aeeb799a, state.get_rules_ptr_val());
        return hc_wrapped_expression(state, db, state.get_rules_ptr_val());
    } else {
        if isTokenActive(state.lexer._type, 36) {
            consume(state);
            state.push_fn(branch_a89d6a9cb6db8bfe, state.get_rules_ptr_val());
            return hc_wrapped_expression(state, db, state.get_rules_ptr_val());
        }
    };
    return -1;
}

pub fn hc_wrapped_expression(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    prod: i32,
) -> i32 {
    scan(state, 37, 2);
    if isTokenActive(state.lexer._type, 38) {
        state.push_fn(branch_888b52b8871ccdb3, 9);
        state.push_fn(branch_801d9e42aeeb799a, state.get_rules_ptr_val());
        return hc_statement(state, db, state.get_rules_ptr_val());
    } else {
        if state.lexer._type == 66 || state.lexer._type == 67 {
            state.push_fn(branch_888b52b8871ccdb3, 9);
            state.push_fn(branch_d63d3ec8bde71654, state.get_rules_ptr_val());
            return hc_sentence(state, db, state.get_rules_ptr_val());
        } else {
            if state.lexer._type == 28 {
                state.push_fn(branch_888b52b8871ccdb3, 9);
                consume(state);
                state.push_fn(branch_612fae9e544dec3a, state.get_rules_ptr_val());
                return hc_statement(state, db, state.get_rules_ptr_val());
            } else {
                {
                    state.push_fn(branch_888b52b8871ccdb3, 9);
                    state.push_fn(branch_d63d3ec8bde71654, state.get_rules_ptr_val());
                    return hc_identifier(state, db, state.get_rules_ptr_val());
                }
            }
        }
    };
    return -1;
}

pub fn hc_sort_clause(state: &mut ParserState, db: &mut ParserStateBuffer, prod: i32) -> i32 {
    scan(state, 39, 2);
    if state.lexer._type == 30 {
        consume(state);
        scan(state, 40, 2);
        if isTokenActive(state.lexer._type, 38) {
            state.push_fn(branch_43a8da60c5314938, 10);
            state.push_fn(branch_c417a0113f98071e, state.get_rules_ptr_val());
            return hc_sort_clause_list_69(state, db, state.get_rules_ptr_val());
        } else {
            if state.lexer._type == 11 {
                consume(state);
                scan(state, 41, 2);
                if isTokenActive(state.lexer._type, 38) {
                    state.push_fn(branch_43a8da60c5314938, 10);
                    state.push_fn(branch_35e17ca21e7355a9, state.get_rules_ptr_val());
                    return hc_sort_clause_list_69(state, db, state.get_rules_ptr_val());
                } else {
                    {
                        add_reduce(state, 2, 0);
                        return 10;
                    }
                };
            } else {
                {
                    return 10;
                }
            }
        };
    } else {
        if state.lexer._type == 32 {
            consume(state);
            scan(state, 42, 2);
            if isTokenActive(state.lexer._type, 38) {
                state.push_fn(branch_43a8da60c5314938, 10);
                state.push_fn(branch_c417a0113f98071e, state.get_rules_ptr_val());
                return hc_sort_clause_list_69(state, db, state.get_rules_ptr_val());
            } else {
                if state.lexer._type == 11 {
                    consume(state);
                    scan(state, 41, 2);
                    if isTokenActive(state.lexer._type, 38) {
                        state.push_fn(branch_43a8da60c5314938, 10);
                        state.push_fn(branch_35e17ca21e7355a9, state.get_rules_ptr_val());
                        return hc_sort_clause_list_69(state, db, state.get_rules_ptr_val());
                    } else {
                        {
                            add_reduce(state, 2, 0);
                            return 10;
                        }
                    };
                } else {
                    {
                        return 10;
                    }
                }
            };
        } else {
            if state.lexer._type == 33 {
                consume(state);
                scan(state, 43, 2);
                if isTokenActive(state.lexer._type, 38) {
                    state.push_fn(branch_43a8da60c5314938, 10);
                    state.push_fn(branch_c417a0113f98071e, state.get_rules_ptr_val());
                    return hc_sort_clause_list_69(state, db, state.get_rules_ptr_val());
                } else {
                    if state.lexer._type == 11 {
                        consume(state);
                        scan(state, 41, 2);
                        if isTokenActive(state.lexer._type, 38) {
                            state.push_fn(branch_43a8da60c5314938, 10);
                            state.push_fn(branch_35e17ca21e7355a9, state.get_rules_ptr_val());
                            return hc_sort_clause_list_69(state, db, state.get_rules_ptr_val());
                        } else {
                            {
                                add_reduce(state, 2, 0);
                                return 10;
                            }
                        };
                    } else {
                        {
                            return 10;
                        }
                    }
                };
            } else {
                if state.lexer._type == 34 {
                    consume(state);
                    scan(state, 44, 2);
                    if isTokenActive(state.lexer._type, 38) {
                        state.push_fn(branch_43a8da60c5314938, 10);
                        state.push_fn(branch_c417a0113f98071e, state.get_rules_ptr_val());
                        return hc_sort_clause_list_69(state, db, state.get_rules_ptr_val());
                    } else {
                        if state.lexer._type == 11 {
                            consume(state);
                            scan(state, 41, 2);
                            if isTokenActive(state.lexer._type, 38) {
                                state.push_fn(branch_43a8da60c5314938, 10);
                                state.push_fn(branch_35e17ca21e7355a9, state.get_rules_ptr_val());
                                return hc_sort_clause_list_69(
                                    state,
                                    db,
                                    state.get_rules_ptr_val(),
                                );
                            } else {
                                {
                                    add_reduce(state, 2, 0);
                                    return 10;
                                }
                            };
                        } else {
                            {
                                return 10;
                            }
                        }
                    };
                } else {
                    if state.lexer._type == 31 {
                        consume(state);
                        scan(state, 45, 2);
                        if isTokenActive(state.lexer._type, 38) {
                            state.push_fn(branch_43a8da60c5314938, 10);
                            state.push_fn(branch_c417a0113f98071e, state.get_rules_ptr_val());
                            return hc_sort_clause_list_69(state, db, state.get_rules_ptr_val());
                        } else {
                            {
                                return 10;
                            }
                        };
                    }
                }
            }
        }
    };
    return -1;
}

pub fn hc_statement(state: &mut ParserState, db: &mut ParserStateBuffer, prod: i32) -> i32 {
    scan(state, 46, 2);
    if state.lexer._type == 35 || state.lexer._type == 36 {
        state.push_fn(branch_8b15013bc34161b4, 11);
        state.push_fn(branch_801d9e42aeeb799a, state.get_rules_ptr_val());
        return hc_created_statement(state, db, state.get_rules_ptr_val());
    } else {
        if state.lexer._type == 37 || state.lexer._type == 38 {
            state.push_fn(branch_8b15013bc34161b4, 11);
            state.push_fn(branch_801d9e42aeeb799a, state.get_rules_ptr_val());
            return hc_modified_statement(state, db, state.get_rules_ptr_val());
        } else {
            if state.lexer._type == 39 || state.lexer._type == 40 {
                state.push_fn(branch_8b15013bc34161b4, 11);
                state.push_fn(branch_801d9e42aeeb799a, state.get_rules_ptr_val());
                return hc_size_statement(state, db, state.get_rules_ptr_val());
            } else {
                {
                    state.push_fn(branch_8b15013bc34161b4, 11);
                    state.push_fn(branch_801d9e42aeeb799a, state.get_rules_ptr_val());
                    return hc_tag_statement(state, db, state.get_rules_ptr_val());
                }
            }
        }
    };
    return -1;
}

pub fn hc_created_statement(state: &mut ParserState, db: &mut ParserStateBuffer, prod: i32) -> i32 {
    scan(state, 47, 2);
    if state.lexer._type == 35 {
        consume(state);
        scan(state, 48, 2);
        if isTokenActive(state.lexer._type, 18) {
            state.push_fn(branch_8498e7b18db31ad9, 12);
            state.push_fn(branch_dd0d4861991a0119, state.get_rules_ptr_val());
            return hc_order(state, db, state.get_rules_ptr_val());
        } else {
            if isTokenActive(state.lexer._type, 19) {
                scan(state, 16, 2);
                state.push_fn(branch_a5c360a587145794, state.get_rules_ptr_val());
                return hc_comparison_expression(state, db, state.get_rules_ptr_val());
            } else {
                if state.lexer._type == 49 || state.lexer._type == 51 {
                    let fk1: &mut ParserState = fork(state, db);
                    fk1.push_fn(branch_b6dd2507bc197b7a, 0);
                    state.push_fn(branch_beb9a9d8bd8b632c, 0);
                    return 0;
                } else {
                    {
                        add_reduce(state, 1, 24);
                        return 12;
                    }
                }
            }
        };
    } else {
        if state.lexer._type == 36 {
            consume(state);
            scan(state, 49, 2);
            if isTokenActive(state.lexer._type, 18) {
                state.push_fn(branch_8498e7b18db31ad9, 12);
                state.push_fn(branch_dd0d4861991a0119, state.get_rules_ptr_val());
                return hc_order(state, db, state.get_rules_ptr_val());
            } else {
                if isTokenActive(state.lexer._type, 19) {
                    scan(state, 16, 2);
                    state.push_fn(branch_a5c360a587145794, state.get_rules_ptr_val());
                    return hc_comparison_expression(state, db, state.get_rules_ptr_val());
                } else {
                    if state.lexer._type == 49 || state.lexer._type == 51 {
                        let fk1: &mut ParserState = fork(state, db);
                        fk1.push_fn(branch_b6dd2507bc197b7a, 0);
                        state.push_fn(branch_beb9a9d8bd8b632c, 0);
                        return 0;
                    } else {
                        {
                            add_reduce(state, 1, 24);
                            return 12;
                        }
                    }
                }
            };
        }
    };
    return -1;
}

pub fn hc_modified_statement(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    prod: i32,
) -> i32 {
    scan(state, 50, 2);
    if state.lexer._type == 37 {
        consume(state);
        scan(state, 51, 2);
        if isTokenActive(state.lexer._type, 18) {
            state.push_fn(branch_e28f297a41189e8a, 13);
            state.push_fn(branch_321cf8c8907be6d4, state.get_rules_ptr_val());
            return hc_order(state, db, state.get_rules_ptr_val());
        } else {
            if isTokenActive(state.lexer._type, 19) {
                scan(state, 16, 2);
                state.push_fn(branch_34ef0f5aa4254d09, state.get_rules_ptr_val());
                return hc_comparison_expression(state, db, state.get_rules_ptr_val());
            } else {
                if state.lexer._type == 49 || state.lexer._type == 51 {
                    let fk1: &mut ParserState = fork(state, db);
                    fk1.push_fn(branch_8d085c7331d0f87b, 0);
                    state.push_fn(branch_35e9ba8b4eafc319, 0);
                    return 0;
                } else {
                    {
                        add_reduce(state, 1, 28);
                        return 13;
                    }
                }
            }
        };
    } else {
        if state.lexer._type == 38 {
            consume(state);
            scan(state, 52, 2);
            if isTokenActive(state.lexer._type, 18) {
                state.push_fn(branch_e28f297a41189e8a, 13);
                state.push_fn(branch_321cf8c8907be6d4, state.get_rules_ptr_val());
                return hc_order(state, db, state.get_rules_ptr_val());
            } else {
                if isTokenActive(state.lexer._type, 19) {
                    scan(state, 16, 2);
                    state.push_fn(branch_34ef0f5aa4254d09, state.get_rules_ptr_val());
                    return hc_comparison_expression(state, db, state.get_rules_ptr_val());
                } else {
                    if state.lexer._type == 49 || state.lexer._type == 51 {
                        let fk1: &mut ParserState = fork(state, db);
                        fk1.push_fn(branch_8d085c7331d0f87b, 0);
                        state.push_fn(branch_35e9ba8b4eafc319, 0);
                        return 0;
                    } else {
                        {
                            add_reduce(state, 1, 28);
                            return 13;
                        }
                    }
                }
            };
        }
    };
    return -1;
}

pub fn hc_size_statement(state: &mut ParserState, db: &mut ParserStateBuffer, prod: i32) -> i32 {
    scan(state, 53, 2);
    if state.lexer._type == 39 || state.lexer._type == 40 {
        consume(state);
        scan(state, 16, 2);
        state.push_fn(branch_362d716434dc4a2f, state.get_rules_ptr_val());
        return hc_comparison_expression(state, db, state.get_rules_ptr_val());
    };
    return -1;
}

pub fn hc_tag_statement(state: &mut ParserState, db: &mut ParserStateBuffer, prod: i32) -> i32 {
    scan(state, 54, 2);
    if state.lexer._type == 41 {
        consume(state);
        scan(state, 12, 2);
        state.push_fn(branch_8fecb981d042a9c7, state.get_rules_ptr_val());
        return hc_identifier(state, db, state.get_rules_ptr_val());
    };
    return -1;
}

pub fn hc_comparison_expression(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    prod: i32,
) -> i32 {
    scan(state, 16, 2);
    if state.lexer._type == 53 || state.lexer._type == 54 {
        state.push_fn(branch_8ba061fad6ecdb02, 16);
        state.push_fn(branch_801d9e42aeeb799a, state.get_rules_ptr_val());
        return hc_date_expression(state, db, state.get_rules_ptr_val());
    } else {
        if state.lexer._type == 44 || state.lexer._type == 49 {
            consume(state);
            scan(state, 6, 2);
            if (state.lexer._type == 5) {
                consume(state);
                add_reduce(state, 2, 37);
                return 16;
            };
        } else {
            if state.lexer._type == 45 || state.lexer._type == 51 {
                consume(state);
                scan(state, 6, 2);
                if (state.lexer._type == 5) {
                    consume(state);
                    add_reduce(state, 2, 38);
                    return 16;
                };
            } else {
                if state.lexer._type == 46 || state.lexer._type == 47 {
                    consume(state);
                    scan(state, 55, 2);
                    if state.lexer._type == 65 || state.lexer._type == 68 {
                        state.push_fn(branch_8ba061fad6ecdb02, 16);
                        state.push_fn(branch_58a70e7a743ce1a8, state.get_rules_ptr_val());
                        return hc_identifier(state, db, state.get_rules_ptr_val());
                    } else {
                        if state.lexer._type == 5 {
                            state.push_fn(branch_8ba061fad6ecdb02, 16);
                            consume(state);
                            add_reduce(state, 2, 39);
                            return 0;
                        }
                    };
                } else {
                    if state.lexer._type == 42 {
                        consume(state);
                        scan(state, 56, 2);
                        if state.lexer._type == 43 {
                            consume(state);
                            scan(state, 55, 2);
                            if state.lexer._type == 65 || state.lexer._type == 68 {
                                state.push_fn(branch_8ba061fad6ecdb02, 16);
                                state.push_fn(branch_10aef1dcb163497c, state.get_rules_ptr_val());
                                return hc_identifier(state, db, state.get_rules_ptr_val());
                            } else {
                                if state.lexer._type == 5 {
                                    state.push_fn(branch_8ba061fad6ecdb02, 16);
                                    consume(state);
                                    add_reduce(state, 3, 35);
                                    return 0;
                                }
                            };
                        };
                    } else {
                        if state.lexer._type == 43 {
                            consume(state);
                            scan(state, 57, 2);
                            if state.lexer._type == 53 || state.lexer._type == 54 {
                                state.push_fn(branch_8ba061fad6ecdb02, 16);
                                state.push_fn(branch_c417a0113f98071e, state.get_rules_ptr_val());
                                return hc_date_expression(state, db, state.get_rules_ptr_val());
                            } else {
                                if state.lexer._type == 52 {
                                    state.push_fn(branch_8ba061fad6ecdb02, 16);
                                    state.push_fn(
                                        branch_c417a0113f98071e,
                                        state.get_rules_ptr_val(),
                                    );
                                    return hc_range_expression(
                                        state,
                                        db,
                                        state.get_rules_ptr_val(),
                                    );
                                } else {
                                    if state.lexer._type == 44 {
                                        consume(state);
                                        scan(state, 58, 2);
                                        if state.lexer._type == 48 {
                                            state.push_fn(branch_8ba061fad6ecdb02, 16);
                                            consume(state);
                                            scan(state, 6, 2);
                                            if (state.lexer._type == 5) {
                                                consume(state);
                                                add_reduce(state, 4, 41);
                                                return 0;
                                            };
                                            return -1;
                                        } else {
                                            if state.lexer._type == 5 {
                                                state.push_fn(branch_8ba061fad6ecdb02, 16);
                                                consume(state);
                                                add_reduce(state, 3, 43);
                                                return 0;
                                            }
                                        };
                                    } else {
                                        if state.lexer._type == 50 {
                                            consume(state);
                                            scan(state, 58, 2);
                                            if state.lexer._type == 48 {
                                                state.push_fn(branch_8ba061fad6ecdb02, 16);
                                                consume(state);
                                                scan(state, 6, 2);
                                                if (state.lexer._type == 5) {
                                                    consume(state);
                                                    add_reduce(state, 4, 42);
                                                    return 0;
                                                };
                                                return -1;
                                            } else {
                                                if state.lexer._type == 5 {
                                                    state.push_fn(branch_8ba061fad6ecdb02, 16);
                                                    consume(state);
                                                    add_reduce(state, 3, 44);
                                                    return 0;
                                                }
                                            };
                                        } else {
                                            if state.lexer._type == 65 || state.lexer._type == 68 {
                                                state.push_fn(branch_8ba061fad6ecdb02, 16);
                                                state.push_fn(
                                                    branch_58a70e7a743ce1a8,
                                                    state.get_rules_ptr_val(),
                                                );
                                                return hc_identifier(
                                                    state,
                                                    db,
                                                    state.get_rules_ptr_val(),
                                                );
                                            } else {
                                                if state.lexer._type == 5 {
                                                    state.push_fn(branch_8ba061fad6ecdb02, 16);
                                                    consume(state);
                                                    add_reduce(state, 2, 39);
                                                    return 0;
                                                }
                                            }
                                        }
                                    }
                                }
                            };
                        } else {
                            {
                                state.push_fn(branch_8ba061fad6ecdb02, 16);
                                state.push_fn(branch_801d9e42aeeb799a, state.get_rules_ptr_val());
                                return hc_range_expression(state, db, state.get_rules_ptr_val());
                            }
                        }
                    }
                }
            }
        }
    };
    return -1;
}

pub fn hc_range_expression(state: &mut ParserState, db: &mut ParserStateBuffer, prod: i32) -> i32 {
    scan(state, 59, 2);
    if state.lexer._type == 52 {
        consume(state);
        scan(state, 6, 2);
        if state.lexer._type == 5 {
            consume(state);
            scan(state, 60, 2);
            if isTokenActive(state.lexer._type, 61) {
                state.push_fn(branch_9d492d288a320a38, 17);
                state.push_fn(branch_f8a3663a4a4d8c1f, state.get_rules_ptr_val());
                return hc_range_expression_group_155_0_(state, db, state.get_rules_ptr_val());
            } else {
                {
                    add_reduce(state, 2, 45);
                    return 17;
                }
            };
        };
    };
    return -1;
}

pub fn hc_date_expression(state: &mut ParserState, db: &mut ParserStateBuffer, prod: i32) -> i32 {
    scan(state, 62, 2);
    if state.lexer._type == 53 || state.lexer._type == 54 {
        consume(state);
        scan(state, 63, 2);
        if state.lexer._type == 5 {
            let pk: Lexer = state.lexer.copyInPlace();
            scan(state, 64, 21);
            if isTokenActive(pk._type, 8) {
                let fk1: &mut ParserState = fork(state, db);
                fk1.push_fn(branch_3ceb3b8dbd024280, 0);
                state.push_fn(branch_8fadd9dd6de0ad4f, 0);
                return 0;
            } else {
                if isTokenActive(pk._type, 65) {
                    let fk1: &mut ParserState = fork(state, db);
                    fk1.push_fn(branch_dcc14dfd9901ab2c, 0);
                    state.push_fn(branch_55f055cf6269a4fe, 0);
                    return 0;
                } else {
                    {
                        scan(state, 63, 2);
                        state.push_fn(branch_ddab4016b452cba1, state.get_rules_ptr_val());
                        return hc_string_data(state, db, state.get_rules_ptr_val());
                    }
                }
            };
        } else {
            {
                scan(state, 63, 2);
                state.push_fn(branch_ddab4016b452cba1, state.get_rules_ptr_val());
                return hc_string_data(state, db, state.get_rules_ptr_val());
            }
        };
    };
    return -1;
}

pub fn hc_order(state: &mut ParserState, db: &mut ParserStateBuffer, prod: i32) -> i32 {
    scan(state, 66, 2);
    if isTokenActive(state.lexer._type, 67) {
        consume(state);
        add_reduce(state, 1, 48);
        return 19;
    } else {
        if isTokenActive(state.lexer._type, 68) {
            consume(state);
            add_reduce(state, 1, 49);
            return 19;
        }
    };
    return -1;
}

pub fn hc_identifier(state: &mut ParserState, db: &mut ParserStateBuffer, prod: i32) -> i32 {
    state.push_fn(branch_e77a6e4869683f1a, state.get_rules_ptr_val());
    return hc_identifier_list_200(state, db, state.get_rules_ptr_val());
}

pub fn hc_identifier_part(state: &mut ParserState, db: &mut ParserStateBuffer, prod: i32) -> i32 {
    scan(state, 12, 2);
    if state.lexer._type == 68 {
        state.push_fn(branch_5ccd1d9a04b4fbc7, 21);
        state.push_fn(branch_801d9e42aeeb799a, state.get_rules_ptr_val());
        return hc_wild_card(state, db, state.get_rules_ptr_val());
    } else {
        if state.lexer._type == 65 {
            state.push_fn(branch_5ccd1d9a04b4fbc7, 21);
            consume(state);
            return 0;
        }
    };
    return -1;
}

pub fn hc_sentence(state: &mut ParserState, db: &mut ParserStateBuffer, prod: i32) -> i32 {
    scan(state, 69, 2);
    if state.lexer._type == 66 {
        state.push_fn(set_prod, 22);
        consume(state);
        scan(state, 70, 2);
        if (state.lexer._type == 65) {
            consume(state);
            scan(state, 71, 2);
            if (state.lexer._type == 66) {
                consume(state);
                add_reduce(state, 3, 16);
                return 0;
            };
        };
        return -1;
    } else {
        if state.lexer._type == 67 {
            state.push_fn(branch_3556e1fd2dfb32ff, 22);
            consume(state);
            scan(state, 70, 2);
            if (state.lexer._type == 65) {
                consume(state);
                scan(state, 72, 2);
                if (state.lexer._type == 67) {
                    consume(state);
                    add_reduce(state, 3, 16);
                    return 0;
                };
            };
            return -1;
        }
    };
    return -1;
}

pub fn hc_string_data(state: &mut ParserState, db: &mut ParserStateBuffer, prod: i32) -> i32 {
    state.push_fn(branch_c211ddbd073f9a38, state.get_rules_ptr_val());
    return hc_string_symbols(state, db, state.get_rules_ptr_val());
}

pub fn hc_wild_card(state: &mut ParserState, db: &mut ParserStateBuffer, prod: i32) -> i32 {
    scan(state, 73, 2);
    if state.lexer._type == 68 {
        consume(state);
        return 24;
    };
    return -1;
}

pub fn hc_string_data_val(state: &mut ParserState, db: &mut ParserStateBuffer, prod: i32) -> i32 {
    scan(state, 74, 21);
    if state.lexer._type == 69 {
        state.push_fn(branch_1891e5ab512e05c6, 25);
        state.push_fn(branch_801d9e42aeeb799a, state.get_rules_ptr_val());
        return hc_escaped_value(state, db, state.get_rules_ptr_val());
    } else {
        if isTokenActive(state.lexer._type, 0) {
            state.push_fn(branch_1891e5ab512e05c6, 25);
            state.push_fn(branch_801d9e42aeeb799a, state.get_rules_ptr_val());
            return hc_string_symbols(state, db, state.get_rules_ptr_val());
        } else {
            if state.lexer._type == 8 {
                state.push_fn(branch_1891e5ab512e05c6, 25);
                consume(state);
                return 0;
            }
        }
    };
    return -1;
}

pub fn hc_escaped_value(state: &mut ParserState, db: &mut ParserStateBuffer, prod: i32) -> i32 {
    scan(state, 75, 2);
    if state.lexer._type == 69 {
        consume(state);
        scan(state, 63, 2);
        if (isTokenActive(state.lexer._type, 0)) {
            state.push_fn(branch_d3da4f004e951e4a, state.get_rules_ptr_val());
            return hc_string_symbols(state, db, state.get_rules_ptr_val());
        };
    };
    return -1;
}

pub fn hc_string_symbols(state: &mut ParserState, db: &mut ParserStateBuffer, prod: i32) -> i32 {
    scan(state, 63, 2);
    if isTokenActive(state.lexer._type, 0) {
        consume(state);
        return 27;
    };
    return -1;
}

pub fn hc_container_clause_list_6(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    prod: i32,
) -> i32 {
    state.push_fn(branch_4fb73788d1fe626a, state.get_rules_ptr_val());
    return hc_container_identifier(state, db, state.get_rules_ptr_val());
}

pub fn hc_container_clause_list_6_goto(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    loop {
        match (prod) {
            28 => {
                scan(state, 76, 2);
                if state.lexer._type == 65 || state.lexer._type == 68 {
                    let fk1: &mut ParserState = fork(state, db);
                    fk1.push_fn(branch_046f073da918dca6, 0);
                    state.push_fn(branch_ef1348ecf1abe6e5, 0);
                    return 0;
                } else {
                    {
                        return 28;
                    }
                };
            }
            _ => (),
        };
        break;
    }
    return if (prod == 28) { prod } else { -1 };
}

pub fn hc_sort_clause_list_69(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    prod: i32,
) -> i32 {
    state.push_fn(branch_d95c53e16e6a00ca, state.get_rules_ptr_val());
    return hc_statement(state, db, state.get_rules_ptr_val());
}

pub fn hc_sort_clause_list_69_goto(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    loop {
        match (prod) {
            29 => {
                scan(state, 77, 2);
                if state.lexer._type == 70 {
                    state.push_fn(branch_e85dedf30b7981e1, 29);
                    consume(state);
                    state.push_fn(branch_0912092e7d3508ca, state.get_rules_ptr_val());
                    return hc_statement(state, db, state.get_rules_ptr_val());
                } else {
                    {
                        return 29;
                    }
                };
            }
            _ => (),
        };
        break;
    }
    return if (prod == 29) { prod } else { -1 };
}

pub fn hc_range_expression_group_155_0_(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    prod: i32,
) -> i32 {
    scan(state, 78, 2);
    if isTokenActive(state.lexer._type, 61) {
        consume(state);
        scan(state, 6, 2);
        if (state.lexer._type == 5) {
            consume(state);
            add_reduce(state, 2, 16);
            return 30;
        };
    };
    return -1;
}

pub fn hc_date_expression_group_163_0_(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    prod: i32,
) -> i32 {
    scan(state, 7, 2);
    if isTokenActive(state.lexer._type, 8) {
        consume(state);
        scan(state, 63, 2);
        if state.lexer._type == 5 {
            let pk: Lexer = state.lexer.copyInPlace();
            scan(state, 79, 21);
            if isTokenActive(pk._type, 65) {
                let fk1: &mut ParserState = fork(state, db);
                fk1.push_fn(branch_4ec0d704b96d7b91, 0);
                state.push_fn(branch_baa02ecb9d77dd49, 0);
                return 0;
            } else {
                {
                    state.lexer._type = 5;
                    state.push_fn(branch_4f3f36114e273f49, 31);
                    state.push_fn(branch_54c6214b083ed3d4, state.get_rules_ptr_val());
                    return hc_string_data(state, db, state.get_rules_ptr_val());
                }
            };
        } else {
            {
                state.push_fn(branch_4f3f36114e273f49, 31);
                state.push_fn(branch_54c6214b083ed3d4, state.get_rules_ptr_val());
                return hc_string_data(state, db, state.get_rules_ptr_val());
            }
        };
    };
    return -1;
}

pub fn hc_identifier_list_200(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    prod: i32,
) -> i32 {
    state.push_fn(branch_5242960545d4416e, state.get_rules_ptr_val());
    return hc_identifier_part(state, db, state.get_rules_ptr_val());
}

pub fn hc_identifier_list_200_goto(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    loop {
        match (prod) {
            32 => {
                scan(state, 80, 2);
                if state.lexer._type == 65 || state.lexer._type == 68 {
                    state.push_fn(branch_f7367ead60daa727, 32);
                    state.push_fn(branch_d17876edfcf7e4d4, state.get_rules_ptr_val());
                    return hc_identifier_part(state, db, state.get_rules_ptr_val());
                };
            }
            _ => (),
        };
        break;
    }
    return if (prod == 32) { prod } else { -1 };
}

pub fn hc_string_data_list_210(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    prod: i32,
) -> i32 {
    state.push_fn(branch_9ff46550de479abc, state.get_rules_ptr_val());
    return hc_string_data_val(state, db, state.get_rules_ptr_val());
}

pub fn hc_string_data_list_210_goto(
    state: &mut ParserState,
    db: &mut ParserStateBuffer,
    mut prod: i32,
) -> i32 {
    loop {
        match (prod) {
            33 => {
                scan(state, 81, 21);
                if isTokenActive(state.lexer._type, 22) {
                    state.push_fn(branch_16fdf8b400e1b22b, 33);
                    state.push_fn(branch_d17876edfcf7e4d4, state.get_rules_ptr_val());
                    return hc_string_data_val(state, db, state.get_rules_ptr_val());
                };
            }
            _ => (),
        };
        break;
    }
    return if (prod == 33) { prod } else { -1 };
}
