import ruminate_constructor from "../source/ruminate.js";
import { RUMINATE_SERVER, RUMINATE_UPDATE_QUEUE_ALERT } from "../source/common/symbols.js";
import Note from "../source/common/note.js";
import Container from "../source/server/common/container.js";
import UID from "../source/common/uid.js";
import fuzzy from "../source/common/fuzzy.js";
import crdt from "../source/cpp/crdt.asm.js";
import { noteDataToBuffer, noteDataFromBuffer } from "../source/common/serialization.js";


const massiveTextA =
    `“Oh, don’t speak to me of Austria. Perhaps I don’t understand things, but Austria never has wished, and does not wish, for war. She is betraying us! Russia alone must save Europe. Our gracious sovereign recognizes his high vocation and will be true to it. That is the one thing I have faith in! Our good and wonderful sovereign has to perform the noblest role on earth, and he is so virtuous and noble that God will not forsake him. He will fulfill his vocation and crush the hydra of revolution, which has become more terrible than ever in the person of this murderer and villain! We alone must avenge the blood of the just one. . . . Whom, I ask you, can we rely on? . . . England with her commercial spirit will not and cannot understand the Emperor Alexander’s loftiness of soul. She has refused to evacuate Malta. She wanted to find, and still seeks, some secret motive in our actions. What answer did Novosiltsev get? None. The English have not understood and cannot understand the self-abnegation of our Emperor who wants nothing for himself, but only desires the good of mankind. And what have they promised? Nothing! And what little they have promised they will not perform! Prussia has always declared that Buonaparte is invincible, and that all Europe is powerless before him. . . . And I don’t believe a word that Hardenburg says, or Haugwitz either. This famous Prussian neutrality is just a trap. I have faith only in God and the lofty destiny of our adored monarch. He will save Europe!”`
const massiveTextB =
    `“Oh, don’t speak to me of Austria. [Redacted!] but Austria never has wished, and does not wish, for war. [Redacted!] of our Emperor who wants nothing for himself, but only desires the good of mankind. And what have they promised? Nothing! And what little they have promised they will not perform! Prussia has always declared that Buonaparte is invincible, and that all Europe is powerless before him. . . . And I don’t believe a word that Hardenburg says, or Haugwitz either. This famous Prussian neutrality is just a trap. I have faith only in God and the lofty destiny of our adored monarch. He will save Europe!”`
export default function() {

    const ruminate = new ruminate_constructor();

    describe("Serialization", function() {
        it("Serializes note data", function(){
            const uid = new UID;
            const id = "/test/a/b/c/ note name";
            const tags = new Map([["ima", {v:"test"}]]);
            const body = "This is the note body in string form";

            const buffer = noteDataToBuffer(uid, id, tags, body);

            buffer.should.be.instanceOf(ArrayBuffer);

            const {body:b, tags:t, id:ID, uid:u} = noteDataFromBuffer(buffer);

            b.should.equal(body);
            ID.should.equal(id);
            t.get("ima").should.have.property("v", "test");
            u.toString().should.equal(uid.toString());
        })
    })

    describe("Options", function() {
        describe("sync_rate", function() {
            it("2000", () => (new ruminate_constructor({ sync_rate: 2000 })).sync_rate.should.equal(2000));
            it("0", () => (new ruminate_constructor({ sync_rate: 0 })).sync_rate.should.equal(1000));
            it("3000000000", () => (new ruminate_constructor({ sync_rate: 3000000000 })).sync_rate.should.equal(3600000));
            it("null", () => (new ruminate_constructor({ sync_rate: null })).sync_rate.should.equal(-1));
        })

        describe("server", function() {
            it("generic_server", () => {

                const base_server = {
                    storeNote: () => {},
                    removeNote: () => {},
                    implode: () => {},
                    query: () => {},
                    getUpdatedUIDs: () => {}
                };

                const g = (new ruminate_constructor({ server: base_server }));
                g[RUMINATE_SERVER].should.equal(base_server);
            });
        })
    })

    describe("WebAssembly", function() {

        this.slow(50000)
        this.timeout(50000)

        it.only("CRDT", function(done) {

            var Module = {
                onRuntimeInitialized: function() {
                    var string = new Module.CTString(2);
                    const cursor = string.insert(0, "I need some hell");
                    const other_site_a = string.split();
                    const other_site_b = string.split();
                    other_site_a.delete(16, 4);
                    other_site_b.delete(16, 4);
                    other_site_b.insert(12, "cow bell!");
                    other_site_a.insert(5, "help");
                    const ref = string.getReferenceAtOffset(8);
                    other_site_b.merge(other_site_a);
                    other_site_a.merge(other_site_b);
                    string.merge(other_site_a);
                    string.insert(5, "d ")
                    other_site_b.insert(9, "e")
                    other_site_a.delete(9, 4)
                    other_site_a.merge(string);
                    other_site_b.merge(other_site_a);
                    other_site_a.merge(other_site_b);
                    string.merge(other_site_a);
                    other_site_a.delete(7, 1)
                    other_site_b.merge(other_site_a);
                    other_site_a.value.should.equal(other_site_b.value);
                    done();
                }
            }
            crdt(Module)
        })
    })

    it("jsdiff-note", function(done) {
        const note = new Note({
            [RUMINATE_UPDATE_QUEUE_ALERT]: (note) => {
                note.body.should.equal(massiveTextB);
                done()
            }
        }, null, null, null, massiveTextA)

        note.body = massiveTextB;
    })

    describe("Fuzzy search", function() {

        describe("basic matching", function() {

            it("match: search string: as dog; match string: a dog",
                () => fuzzy("a dog", "a dog").score.should.equal(0))

            it("no match: search string: as dog; match string: a bog",
                () => fuzzy("a dog", "a bog").score.should.equal(-1))

            it("match first: search string: as dog; match string: this a cool as do a good blah as as dog blah",
                () => fuzzy("as dog", "this a cool as do a good blah as as dog blah").score.should.be.greaterThan(0))

            it("match best: search string: as dog; match string: this a cool as do a good blah as as dog blah",
                () => fuzzy("as dog", "this a cool as do a good blah as as dog blah", true).score.should.equal(0))

            it("match best: search string: blah as dog; match string: this a cool as do a good blah as as dog blah",
                () => fuzzy("blah as dog", "this a cool as do a good blah as as dog blah", true).score.should.equal(3))

            it("result highlight example",
                () => {
                    const results = fuzzy("do blah as a dog", "this a cool as do a good blah as as dog blah")
                    let out_string = "";
                    let a = "this a cool as do a good blah as as dog blah";
                    let d = ("this a cool as do a good blah as as dog blah").split("");
                    let i_shift = 0;
                    //console.log(results)
                    for (let i = 0; i < results.matches.length; i += 2) {
                        const idx = results.matches[i];
                        const l = results.matches[i + 1];
                        d.splice(idx - i_shift, l, `[${a.slice(idx, idx+l)}]`);
                        i_shift += l - 1;
                    }
                    //console.log(d)

                    console.log(d.join(""))
                })
        })
    })

    it("Container - Retrieve Unique Store", function() {

        let container = new Container;

        container.change("", "/book 1/chapter 1/ Blah")
            .uid.should.be.instanceOf(UID)

        container.change("/book 1/chapter1/ Blah", "/book 1/chapter 1/ Blah")
            .uid.string.should.equal(container.get("/book 1/chapter 1/ Blah").uid.string);

        container.get("/book 1/chapter 1/ Blah")
            .uid.string.should.equal(container.get("/book 1/chapter 1/ Blah").uid.string);

        container.get("/book 1/chapter2/ Blah")
            .uid.string.should.not.equal(container.get("/book 1/chapter 1/ Blah").uid.string);
    })

    it("UID - stores creation date", function() {
        const uida = ruminate.createUID();
        //uida.date_created.getSeconds().should.equal(new Date().getSeconds())
        uida.date_created.getMinutes().should.equal(new Date().getMinutes())
        uida.date_created.getHours().should.equal(new Date().getHours())
        uida.date_created.getDay().should.equal(new Date().getDay());
        const uidb = ruminate.createUID();
        //uidb.date_created.getSeconds().should.equal(new Date().getSeconds())
        uidb.date_created.getMinutes().should.equal(new Date().getMinutes())
        uidb.date_created.getHours().should.equal(new Date().getHours())
        uidb.date_created.getDay().should.equal(new Date().getDay());
        uida.string.should.not.equal(uidb.string);
        const uidc = new UID(uida)
        const uidd = new UID(uida.string)
        uida.string.should.equal(uidc.string);
        uida.string.should.equal(uidd.string);
    })

    it.skip("UID", function() {

        this.slow(50000)
        this.timeout(50000)
        const size = 10000;
        let iter = 0;
        //Stress test for UID.
        const createUIDS = (size) => new Array(size).fill(null).map(ruminate.createUID);

        var set_ = new Set();

        for (const uid of createUIDS(size))
            set_.add(uid.string);

        for (var time = 1000; !!(time--);) {
            for (const uid of createUIDS(size)) {
                iter++;
                if (set_.has(uid.string))
                    throw new Error(`duplicate UID string found: ${uid} ${uid.string} at iteration ${iter}`)
            }
        }
    })
}
