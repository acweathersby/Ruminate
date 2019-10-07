import markdom from "../source/client/common/markdom.js";

export default function() {
    describe("String Parsing", function(){
        describe("Markdown data",function(){
            it("## Header", ()=>markdom.DOMify(`## Header`).childNodes[0].nodeName.should.equal("H2"));
            it("### Header", ()=>markdom.DOMify(`### Header`).childNodes[0].nodeName.should.equal("H3"));
            it("#### Header", ()=>markdom.DOMify(`#### Header`).childNodes[0].nodeName.should.equal("H4"));
            it("##### Header", ()=>markdom.DOMify(`##### Header`).childNodes[0].nodeName.should.equal("H5"));
            it("###### Header", ()=>markdom.DOMify(`###### Header`).childNodes[0].nodeName.should.equal("H6"));
            //it("[test.com]", ()=>markdom.DOMify(`[test.com](test)`).childNodes[0].childNodes[0].nodeName.should.equal("A"));
            it("((./graze_notes))[list]", ()=>markdom.DOMify(`((./graze_notes))[list]`).childNodes[0].nodeName.should.equal("NOTES"));
            it("This is a paragraph", ()=>markdom.DOMify(`This is a paragraph`).childNodes[0].nodeName.should.equal("P"));
            it("This is *in italics* a paragraph", ()=>markdom.DOMify(`This is *in italics* a paragraph`).childNodes[0].childNodes[1].nodeName.should.equal("EM"));

            it("## Header", ()=>markdom.MDify(markdom.DOMify(`## Header`)).should.equal("## Header\n"))
            it("### Header", ()=>markdom.MDify(markdom.DOMify(`### Header`)).should.equal("### Header\n"))
           // it(" [test.com](test)", ()=>markdom.MDify(markdom.DOMify(`[test.com](test)`)).should.equal("[test.com](test)\n"))
            it(" ((./graze_notes))[list]", ()=>markdom.MDify(markdom.DOMify(`((./graze_notes))[list]`)).should.equal("((./graze_notes))[list]\n"))
            it(" ((./graze_notes?#filter|time))[list]", ()=>markdom.MDify(markdom.DOMify(`((./graze_notes?#filter|time))[list]`)).should.equal("((./graze_notes?#filter|time))[list]\n"))
            it("This is a test", ()=>markdom.MDify(markdom.DOMify(`This is a test`)).should.equal("This is a test\n"))
        })
    })
}
