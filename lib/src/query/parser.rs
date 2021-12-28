use super::parser_data::*;
use hctk::completer::*;

pub fn parse(string_data: &[u8]) -> OptionedBoxedASTRef<TypeEnum> {
    parser_core(string_data, 0, EntryPoint_RNQL, &reduce_functions)
}
