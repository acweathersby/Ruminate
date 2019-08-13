import HTML from "@candlefw/html";
import markdom from "../source/client/common/markdom.js";

HTML.polyfill();

export default function() {
    describe.only("String Parsing", function(){
        describe("Markdown data",function(){
            it.only("# **Header**", ()=>markdom.DOMify(
`### *d*   ***Header*** Test ** \`\`\`t**es**t\`\`\` 
 #te this is th<a href="reset">tesr</a> only way to live  

s

\`\`\`
Test this out!
     
  ant

\`\`\`

This is my test
This is the only test *To wit*

`).tag.should.equal("h1"));
            it("## Header", ()=>markdom.DOMify(`## Header`).tag.should.equal("h2"));
            it("### Header", ()=>markdom.DOMify(`### Header`).tag.should.equal("h3"));
            it("#### Header", ()=>markdom.DOMify(`#### Header`).tag.should.equal("h4"));
            it("##### Header", ()=>markdom.DOMify(`##### Header`).tag.should.equal("h5"));
            it("###### Header", ()=>markdom.DOMify(`##### Header`).tag.should.equal("h6"));
            it("This is a paragraph", ()=>markdom.DOMify(`This is a paragraph`).tag.should.equal("p"));
            it("This is *in bold* a paragraph", ()=>markdom.DOMify(`# Header`).tag.should.equal("p"));
        })
    })
}
