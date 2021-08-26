mod crdt_string;
mod op_id;




/*
let mut buffer: Vec<u8> = vec![1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 2];

{
    let (head, body, _tail) = unsafe { buffer[offset..].align_to_mut::<OPID>() };

    println!("{:?}", head);
    assert!(head.is_empty(), "Data was not aligned");

    let obj: &mut OPID = &mut (body[0]);

    println!("{:?}", obj);

    obj.data = 0;
}

println!("{:?}", buffer);
*/
