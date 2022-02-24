use super::ast::*;
use super::parser_data::*;
use hctk::ast::*;
use hctk::*;

pub enum ParseError {
    UNDEFINED,
    UNABLE_TO_DEREF_QUERY_RESULT,
}

pub fn parse(string_data: &str) -> Result<Box<QueryBody>, ParseError> {
    let mut iterator: ReferenceIterator<UTF8StringReader> = ReferenceIterator::new(
        UTF8StringReader::new(Vec::from(string_data.as_bytes())),
        EntryPoint_RNQL,
        &BYTECODE,
    );
    let result = completer(&mut iterator, &FunctionMaps);

    if let Ok(r) = result {
        println!("{:?}", r);
        if let HCObj::NODE(ast) = r {
            if let ASTNode::QueryBody(qb) = ast {
                return Ok(qb);
            }
        }

        return Err(ParseError::UNABLE_TO_DEREF_QUERY_RESULT);
    } else if let Err(action) = result {
        if let ParseAction::ERROR {
            error_code,
            pointer,
            production,
        } = action
        {
            let reader = iterator.reader();
            println!("{:?}", reader.cursor());
            println!("{:?}", reader.codepoint());

            if let Some(prod) = ProductionNames.get(production as usize) {
                println!("{:?}", prod);
            }
            if let Some(tokens) = ExpectedTokenLookup.get(&((pointer & 0xFFFFFF) as i32)) {
                for tk in tokens.iter() {
                    if let Some(&token) = TokenLookup.get(tk) {
                        println!("{:?}", token);
                    }
                }
            }
        }
        Err(ParseError::UNDEFINED)
    } else {
        Err(ParseError::UNDEFINED)
    }
}
#[test]
fn test_parser() {
    parse("[*/test]");
}
