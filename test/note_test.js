import { fillTestData } from "./common.js";
import UID from "../source/common/uid.js";

export default function ruminate_note_test_suite(RuminateConstructor, params) {
    return function() {
        const ruminate = new RuminateConstructor();
        const note = ruminate.createNote("/root/user/test/note_test", "checked, happy, type:note, level:9001", `“Heavens! what a virulent attack!” replied the prince, not in the least disconcerted by this reception. He had just entered, wearing an embroidered court uniform, knee breeches, and shoes, and had stars on his breast and a serene expression on his flat face. He spoke in that refined French in which our grandfathers not only spoke but thought, and with the gentle, patronizing intonation natural to a man of importance who had grown old in society and at court. He went up to Anna Pavlovna, kissed her hand, presenting to her his bald, scented, and shining head, and complacently seated himself on the sofa.` );

        describe("Tags", function() {
            it("retrieving single tag without value", async function() {
                note.getTag("checked").should.equal("checked");
            })    

            it("retrieving single tag with value - level" , async function() {
                note.getTag("level").should.equal(9001);
            })    

            it("retrieving single tag with value - type", async function() {
                note.getTag("type").should.equal("note");
                note.getTag("Type").should.equal("note");
                note.getTag("tYpe").should.equal("note");
                note.getTag("tYPE").should.equal("note");
                note.getTag("type").should.equal("note");
            })    

            it("retrieving single tag with value - type - Proxied", async function() {
                note.tag.type.should.equal("note");
            })    

            it("setting single tag with value - type", async function() {
                note.setTag("type", "calendar")
                note.getTag("type").should.equal("calendar");
            })

            it("setting single tag with value - type - Proxied", async function() {
                note.tag.type = "clipboard";
                note.getTag("type").should.equal("clipboard");
            })

            it("getting all tags", async function() {
                (["checked", "happy", "type", "level"])
                    .reduce((r,e)=>(
                            note.tags.reduce((r, t)=>(t.name == e ? true : r), false) 
                            ? r : !1
                        ), !0
                    ).should.be.true;
            })

            it("deleting single tag", async function() {
                note.removeTag("checked")
                if(note.getTag("checked") !== null) throw new TypeError("Should have been null.");
            })           
        })
    }
}
