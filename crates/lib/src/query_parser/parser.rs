
    
    use candlelib_hydrocarbon::completer::*;
    use super::spec_parser::*;
    
    pub type NodeRef = ASTRef<TypeEnum>;
    pub type BoxedNodeRef = Box<ASTRef<TypeEnum>>;

    #[derive(Debug)]
pub struct QueryBody  { 
            container:BoxedNodeRef,
            filter:BoxedNodeRef,
            sort:BoxedNodeRef
        }

#[derive(Debug)]
pub struct ContainerClause  { 
            path:BoxedNodeRef,
            container:BoxedNodeRef
        }

#[derive(Debug)]
pub struct AND  { 
            left:BoxedNodeRef,
            right:BoxedNodeRef
        }

#[derive(Debug)]
pub struct OR  { 
            left:BoxedNodeRef,
            right:BoxedNodeRef
        }

#[derive(Debug)]
pub struct NOT  { 
            left:BoxedNodeRef
        }

#[derive(Debug)]
pub struct MATCH  { 
            value:BoxedNodeRef
        }

#[derive(Debug)]
pub struct CREATED  { 
            val:BoxedNodeRef,
            order:BoxedNodeRef
        }

#[derive(Debug)]
pub struct MODIFIED  { 
            val:BoxedNodeRef,
            order:BoxedNodeRef
        }

#[derive(Debug)]
pub struct SIZE  { 
            val:BoxedNodeRef,
            order:BoxedNodeRef
        }

#[derive(Debug)]
pub struct TAG  { 
            id:BoxedNodeRef,
            val:BoxedNodeRef,
            order:BoxedNodeRef
        }

#[derive(Debug)]
pub struct EQUALS_QUANTITATIVE  { 
            val:BoxedNodeRef
        }

#[derive(Debug)]
pub struct EQUALS_QUALITATIVE  { 
            val:BoxedNodeRef
        }

#[derive(Debug)]
pub struct GREATERTHAN  { 
            val:BoxedNodeRef
        }

#[derive(Debug)]
pub struct LESSTHAN  { 
            val:BoxedNodeRef
        }

#[derive(Debug)]
pub struct RANGE  { 
            left:BoxedNodeRef,
            right:BoxedNodeRef
        }

#[derive(Debug)]
pub struct DATE  { 
            from:BoxedNodeRef,
            to:BoxedNodeRef
        }

#[derive(Debug)]
pub struct ORDER  { 
            val:f64
        }

#[derive(Debug)]
pub struct IDENTIFIERS  { 
            ids:BoxedNodeRef
        }

    #[derive(Debug)]
    pub enum TypeEnum { QueryBody(QueryBody),
ContainerClause(ContainerClause),
AND(AND),
OR(OR),
NOT(NOT),
MATCH(MATCH),
CREATED(CREATED),
MODIFIED(MODIFIED),
SIZE(SIZE),
TAG(TAG),
EQUALS_QUANTITATIVE(EQUALS_QUANTITATIVE),
EQUALS_QUALITATIVE(EQUALS_QUALITATIVE),
GREATERTHAN(GREATERTHAN),
LESSTHAN(LESSTHAN),
RANGE(RANGE),
DATE(DATE),
ORDER(ORDER),
IDENTIFIERS(IDENTIFIERS) }
    
    static reduce_functions : [ReduceFunction<TypeEnum>; 54] = [
|mut data: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef { data.remove(data.len() - 1) },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let container = stack.remove(0);
    let filter = stack.remove(0);
    let sort = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::QueryBody(QueryBody{container,filter,sort})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let container = Box::new(ASTRef::NONE);
    let filter = stack.remove(0);
    let sort = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::QueryBody(QueryBody{container,filter,sort})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let container = stack.remove(0);
    let filter = Box::new(ASTRef::NONE);
    let sort = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::QueryBody(QueryBody{container,filter,sort})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let container = stack.remove(0);
    let filter = stack.remove(0);
    let sort = Box::new(ASTRef::NONE); 
    Box::new(ASTRef::NODE(TypeEnum::QueryBody(QueryBody{container,filter,sort})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let container = Box::new(ASTRef::NONE);
    let filter = Box::new(ASTRef::NONE);
    let sort = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::QueryBody(QueryBody{container,filter,sort})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let container = Box::new(ASTRef::NONE);
    let filter = stack.remove(0);
    let sort = Box::new(ASTRef::NONE); 
    Box::new(ASTRef::NODE(TypeEnum::QueryBody(QueryBody{container,filter,sort})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let container = stack.remove(0);
    let filter = Box::new(ASTRef::NONE);
    let sort = Box::new(ASTRef::NONE); 
    Box::new(ASTRef::NODE(TypeEnum::QueryBody(QueryBody{container,filter,sort})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let path = stack.remove(0);
    let container = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::ContainerClause(ContainerClause{path,container})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let path = stack.remove(0);
    let container = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::ContainerClause(ContainerClause{path,container})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let path = Box::new(ASTRef::NONE);
    let container = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::ContainerClause(ContainerClause{path,container})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let path = stack.remove(0);
    let container = Box::new(ASTRef::NONE); 
    Box::new(ASTRef::NODE(TypeEnum::ContainerClause(ContainerClause{path,container})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let path = Box::new(ASTRef::NONE);
    let container = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::ContainerClause(ContainerClause{path,container})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let path = stack.remove(0);
    let container = Box::new(ASTRef::NONE); 
    Box::new(ASTRef::NODE(TypeEnum::ContainerClause(ContainerClause{path,container})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ stack.remove(0) },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ stack.remove(2) },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ stack.remove(1) },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let left = stack.remove(0);
    let right = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::AND(AND{left,right})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let left = stack.remove(0);
    let right = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::OR(OR{left,right})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let left = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::NOT(NOT{left})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let value = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::MATCH(MATCH{value})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let val = stack.remove(0);
    let order = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::CREATED(CREATED{val,order})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let val = Box::new(ASTRef::NONE);
    let order = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::CREATED(CREATED{val,order})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let val = stack.remove(0);
    let order = Box::new(ASTRef::NONE); 
    Box::new(ASTRef::NODE(TypeEnum::CREATED(CREATED{val,order})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let val = Box::new(ASTRef::NONE);
    let order = Box::new(ASTRef::NONE); 
    Box::new(ASTRef::NODE(TypeEnum::CREATED(CREATED{val,order})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let val = stack.remove(0);
    let order = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::MODIFIED(MODIFIED{val,order})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let val = Box::new(ASTRef::NONE);
    let order = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::MODIFIED(MODIFIED{val,order})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let val = stack.remove(0);
    let order = Box::new(ASTRef::NONE); 
    Box::new(ASTRef::NODE(TypeEnum::MODIFIED(MODIFIED{val,order})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let val = Box::new(ASTRef::NONE);
    let order = Box::new(ASTRef::NONE); 
    Box::new(ASTRef::NODE(TypeEnum::MODIFIED(MODIFIED{val,order})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let val = stack.remove(0);
    let order = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::SIZE(SIZE{val,order})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let val = stack.remove(0);
    let order = Box::new(ASTRef::NONE); 
    Box::new(ASTRef::NODE(TypeEnum::SIZE(SIZE{val,order})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let id = stack.remove(0);
    let val = stack.remove(0);
    let order = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::TAG(TAG{id,val,order})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let id = stack.remove(0);
    let val = Box::new(ASTRef::NONE);
    let order = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::TAG(TAG{id,val,order})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let id = stack.remove(0);
    let val = stack.remove(0);
    let order = Box::new(ASTRef::NONE); 
    Box::new(ASTRef::NODE(TypeEnum::TAG(TAG{id,val,order})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let id = stack.remove(0);
    let val = Box::new(ASTRef::NONE);
    let order = Box::new(ASTRef::NONE); 
    Box::new(ASTRef::NODE(TypeEnum::TAG(TAG{id,val,order})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let val = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::EQUALS_QUANTITATIVE(EQUALS_QUANTITATIVE{val})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let val = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::EQUALS_QUALITATIVE(EQUALS_QUALITATIVE{val})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let val = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::GREATERTHAN(GREATERTHAN{val})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let val = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::LESSTHAN(LESSTHAN{val})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let val = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::EQUALS_QUANTITATIVE(EQUALS_QUANTITATIVE{val})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let val = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::EQUALS_QUALITATIVE(EQUALS_QUALITATIVE{val})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let val = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::GREATERTHAN(GREATERTHAN{val})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let val = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::LESSTHAN(LESSTHAN{val})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let val = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::GREATERTHAN(GREATERTHAN{val})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let val = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::LESSTHAN(LESSTHAN{val})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let left = stack.remove(0);
    let right = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::RANGE(RANGE{left,right})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let from = stack.remove(0);
    let to = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::DATE(DATE{from,to})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let from = stack.remove(0);
    let to = Box::new(ASTRef::NONE); 
    Box::new(ASTRef::NODE(TypeEnum::DATE(DATE{from,to})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let val: f64 = -1 as f64; 
    Box::new(ASTRef::NODE(TypeEnum::ORDER(ORDER{val})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let val: f64 = 1 as f64; 
    Box::new(ASTRef::NODE(TypeEnum::ORDER(ORDER{val})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
    let ids = stack.remove(0); 
    Box::new(ASTRef::NODE(TypeEnum::IDENTIFIERS(IDENTIFIERS{ids})))
     },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ Box::new(ASTRef::VECTOR(vec![stack.remove(0)])) },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
                let node = stack.remove(1);
                let mut vec = stack.remove(0);

                if let ASTRef::VECTOR(ref mut vector) = vec.as_mut() {
                    vector.push(node);
                }

                vec
             },
|mut stack: Vec<BoxedNodeRef>, body_len: u32| -> BoxedNodeRef{ 
                let node = stack.remove(2);
                let mut vec = stack.remove(0);

                if let ASTRef::VECTOR(ref mut vector) = vec.as_mut() {
                    vector.push(node);
                }

                vec
             }];


    pub fn parse(string_data: &[u8]) -> OptionedBoxedASTRef<TypeEnum> {
        parser_core(string_data, 0, hc_RNQL, &reduce_functions)
    }
