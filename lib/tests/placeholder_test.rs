use lib_ruminate::*;

fn placeholder() -> bool {
    true
}

#[test]
fn it_placeholder_integration() {
    assert_eq!(placeholder(), true);
}
