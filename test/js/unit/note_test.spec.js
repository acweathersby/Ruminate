import ruminate_json_server_constructor from "../../source/js/server/json/server.js";

const RuminateConstructor = ruminate_json_server_constructor;

const ruminate = new RuminateConstructor();

let note = await ruminate.createNote("/root/user/test/note_test", "checked, happy, type:note, level:9001", `“Heavens! what a virulent attack!” replied the prince, not in the least disconcerted by this reception. He had just entered, wearing an embroidered court uniform, knee breeches, and shoes, and had stars on his breast and a serene expression on his flat face. He spoke in that refined French in which our grandfathers not only spoke but thought, and with the gentle, patronizing intonation natural to a man of importance who had grown old in society and at court. He went up to Anna Pavlovna, kissed her hand, presenting to her his bald, scented, and shining head, and complacently seated himself on the sofa.`);;

assert_group("Tags", function () {

    assert("retrieving single tag without value", note.getTag("checked") == ("checked"));

    assert("retrieving single tag with value - level", note.getTag("level") == (9001));

    assert_group("retrieving single tag with value - type", function () {
        assert(note.getTag("type") == ("note"));
        assert(note.getTag("Type") == ("note"));
        assert(note.getTag("tYpe") == ("note"));
        assert(note.getTag("tYPE") == ("note"));
        assert(note.getTag("type") == ("note"));
    });

    assert("retrieving single tag with value - type - Proxied", note.tag.type == ("note"));

    assert_group("setting single tag with value - type", function () {
        note.setTag("type", "calendar");
        assert(note.getTag("type") == ("calendar"));
    });

    assert("setting single tag with value - type - Proxied", function () {
        note.tag.type = "clipboard";
        note.getTag("type") == ("clipboard");
    });

    assert("getting all tags",
        (["checked", "happy", "type", "level"])
            .reduce((r, e) => (
                note.tags.reduce((r, t) => (t.name == e ? true : r), false)
                    ? r : !1
            ), !0) == true
    );

    assert_group("deleting single tag", function () {
        note.removeTag("checked");
        assert(note.getTag("checked") !== null);
    });
});

