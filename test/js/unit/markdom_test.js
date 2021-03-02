import markdom from "../source/client/common/markdom.js";


assert_group("String Parsing", function () {
    assert_group("Markdown data", function () {
        assert("## Header", markdom.DOMify(`## Header`).childNodes[0].nodeName == ("H2"));
        assert("### Header", markdom.DOMify(`### Header`).childNodes[0].nodeName == ("H3"));
        assert("#### Header", markdom.DOMify(`#### Header`).childNodes[0].nodeName == ("H4"));
        assert("##### Header", markdom.DOMify(`##### Header`).childNodes[0].nodeName == ("H5"));
        assert("###### Header", markdom.DOMify(`###### Header`).childNodes[0].nodeName == ("H6"));
        assert("((./graze_notes))[list]", markdom.DOMify(`((./graze_notes))[list]`).childNodes[0].nodeName == ("NOTES"));
        assert("This is a paragraph", markdom.DOMify(`This is a paragraph`).childNodes[0].nodeName == ("P"));
        assert("This is *in italics* a paragraph", markdom.DOMify(`This is *in italics* a paragraph`).childNodes[0].childNodes[1].nodeName == ("EM"));
        assert("## Header", markdom.MDify(markdom.DOMify(`## Header`)) == ("## Header\n"));
        assert("### Header", markdom.MDify(markdom.DOMify(`### Header`)) == ("### Header\n"));
        assert(" ((./graze_notes))[list]", markdom.MDify(markdom.DOMify(`((./graze_notes))[list]`)) == ("((./graze_notes))[list]\n"));
        assert(" ((./graze_notes?#filter|time))[list]", markdom.MDify(markdom.DOMify(`((./graze_notes?#filter|time))[list]`)) == ("((./graze_notes?#filter|time))[list]\n"));
        assert("This is a test", markdom.MDify(markdom.DOMify(`This is a test`)) == ("This is a test\n"));
    });
});

