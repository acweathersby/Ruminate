import graze_constructor from "../source/graze.js";
import Container from "../source/server/common/container.js";
import UID from "../source/common/uid.js";
import fuzzy from "../source/common/fuzzy.js";
import crdt from "../source/cpp/crdt.asm.js";
export default function() {
    this.slow(50000)
    this.timeout(50000)

    const graze = new graze_constructor();

    describe("WebAssembly", function() {
        it.only("test", function(done) {
            var Module = {
                onRuntimeInitialized: function() {

                        var string = new Module.CTString(2);

                        //console.log(JSON.parse(string.inspect));

                        const cursor = string.insert(0, "This is the test");
                        //console.log("SDFSDFDSFSDF")
                        string.insert(5, "Testing ");
       
                        const other_site = string.split();
                        const other_site_b = string.split();

                        other_site.insert(5, "(oops) ");
                        other_site_b.insert(9, " bob ")

                        string.merge(other_site);

                        string.insert(13, " [justice] ")

                        //console.log(JSON.parse(other_site.inspect).ops)
                        //console.log(JSON.parse(string.inspect).ops)
                        other_site.merge(other_site_b)
                        console.log(other_site.value);
                        return done()
                        other_site.insert(18, " (oops) ")
                        console.log(other_site_b.value);

                        other_site_b.merge(other_site)
                        other_site.merge(other_site)
                        string.merge(other_site_b)
                        other_site.merge(string)
                        other_site.delete(6, 2)
                        other_site_b.merge(other_site)
                        string.merge(other_site)

                        console.log(string.value)
                        console.log(other_site.value);
                        console.log(other_site_b.value)

                        string.destroy();
                        other_site.destroy();
                        done();
                }
            }
            crdt(Module)
        })
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


    it.skip("UID", function() {
        const size = 10000;
        let iter = 0;
        //Stress test for UID.
        const createUIDS = (size) => new Array(size).fill(null).map(graze.createUID);

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
