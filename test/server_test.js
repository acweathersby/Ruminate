import { fillTestData } from "./common.js";
import {
    GRAZE_NOTE,
    GRAZE_NOTES,
    GRAZE_SYNC_RATE,
    GRAZE_SYNC_INTERVAL_REF,
    GRAZE_SERVER
} from "../source/common/symbols.js";
import UID from "../source/common/uid.js";

export default function graze_test_suite(GrazeConstructor, ServerConstructor, params) {
    return function() {
        const graze = new GrazeConstructor({ sync_rate: null });
        const server = new ServerConstructor();

        before(async function() {
            //Clear out all data from the test store.
            const s = new ServerConstructor()
            await s.connect(params.server_test_store);

            //Clears all data from server. Server specific and very dangerous
            //This function needs to be called three times to actually work
            s.implode()()();
        })

        function sleep(time) { return new Promise(res => setTimeout(res, Math.min(10000, Math.max(1, time || 10)))) }

        describe("Basic", function() {

            beforeEach(function() {
                graze.connect(server);
                graze.sync_rate = null;
            })

            afterEach(function() {
                graze.disconnect();
                server.implode()()();
                graze.sync_rate = null;
                graze.purgeCache();
            })

            it("warning: empty test", function() {
                graze.should.not.be.undefined;
            })

            it(`connect to server`, function() {

                const graze = new GrazeConstructor();

                graze.should.have.property(GRAZE_SERVER, null);

                graze.connect(server);

                graze[GRAZE_SERVER].type.should.equal(params.server_id)

                graze.disconnect();

                graze.should.have.property(GRAZE_SERVER, null);
            })

            it("create UID", function() {

                const uid = graze.createUID();

                uid.length.should.equal(16);

                const note = graze.createNote("Temp Name", "tagA, tagB, tagC", "Message");

                note.should.have.property("uid");

                note.uid.should.have.lengthOf(16);

                note.body.length.should.equal(7);

                const note2 = graze.createNote("Temp Name", "tagA, tagB, tagC", "Message");

                note2.uid.length.should.equal(16);

                note2.uid.string.should.not.equal(note.uid.string);
            })

            it("store and retrieve - basic", async function() {

                const noteA = graze.createNote("Temp Name A", "tagA, tagB, tagC", "Message A");
                const noteB = graze.createNote("Temp Name B", "tagA, tagB, tagC", "Message B");
                await graze.sync();
                //await sleep(10);

                const noteAd = (await graze.retrieve(noteA.uid.string))[0];
                const noteBd = (await graze.retrieve(noteB.id))[0];

                noteB.body.should.equal(noteBd.body);
                noteA.body.should.equal(noteAd.body);
                noteA.body.should.not.equal(noteBd.body);

                noteA.uid.string.should.equal(noteAd.uid.string);
            })

            it("store and retrieve - collection", async function() {

                const noteA = graze.createNote("temp/Temp Name A", "tagA, tagB, tagC", "Message A");
                const noteB = graze.createNote("temp/Temp Name B", "tagA, tagB, tagC", "Message B");
                const noteC = graze.createNote("temp/temp/Temp Name B", "tagA, tagB, tagC", "Message B");

                await graze.sync();

                const notes = await graze.retrieve("temp/");

                notes.length.should.equal(2);

                notes.sort(graze.sort_indexes.create_time)[0].body.should.equal(noteA.body);
                notes.sort(graze.sort_indexes.create_time)[1].body.should.equal(noteB.body);

                const notes2 = await graze.retrieve("temp/temp/");

                notes2.length.should.equal(1);

                notes2[0].body.should.equal(noteC.body);
            })

            it("store and retrieve - search", async function() {

                const noteA = graze.createNote("temp/Temp Name A", "tagA, tagB, tagC", "Message A");
                const noteB = graze.createNote("temp/Temp Name B", "tagA, tagB, tagC", "Message B");
                const noteC = graze.createNote("temp/temp/Temp Name B", "tagA, tagB, tagC", "Message B");

                await graze.sync();

                const notes = await graze.retrieve("temp/*  ? Name B && Message B");

                notes.length.should.equal(2);

                notes[0].body.should.equal(noteC.body);
            })

            it("Renders note referenced inside another note", async function() {

                const noteG = graze.createNote("temp/Temp Name A", "tagA, tagB, tagC", "inception");
                const noteA = graze.createNote("temp/Temp Name A", "tagA, tagB, tagC", `inside ((${noteG.uid}))`);
                const noteB = graze.createNote("temp/Temp Name B", "tagA, tagB, tagC", `referenced note text: ((${noteA.uid}))`);

                await graze.sync();
                //note does not need to be saved in order to take advantage of reference rendering.

                (await noteB.render()).should.equal("referenced note text: inside inception");
            })
            //*
            //it("warns if no server is connected to graze");

            it("Loads permanently stored data", async function() {
                this.slow(500);
                this.timeout(750);

                const serverA = new ServerConstructor();
                const serverB = new ServerConstructor();
                const serverC = new ServerConstructor();
                //Connect server to data store
                await serverA.connect(params.server_test_store);
                await serverC.connect(params.server_test_store);

                graze.disconnect();

                await graze.connect(serverA);

                await (graze.createNote("temp/tempA/Temp Name A", "tagA, tagB, tagC", "Test 1"));
                await (graze.createNote("temp/tempB/Temp Name B", "tagA, tagB, tagC", "Test 2"));
                await (graze.createNote("temp/tempC/Temp Name C", "tagA, tagB, tagC", "Test 3"));
                await (graze.createNote("temp/tempD/Temp Name D", "tagA, tagB, tagC", "Test 4"));
                await (graze.createNote("temp/tempE/Temp Name E", "tagA, tagB, tagC", "Test 5"));
                await graze.sync();
                graze.disconnect();

                await serverB.connect(params.server_test_store);

                graze.connect(serverB);

                (await graze.retrieve("temp/*")).length.should.equal(5);

                graze.disconnect();

                graze.connect(serverC);

                (await graze.retrieve("temp/tempE/")).length.should.equal(1);
                (await graze.retrieve("temp/*")).length.should.equal(5);
            })

            it("Server.implode dumps all data from store - **dependent on previous test**", async function() {

                const serverA = new ServerConstructor();
                const serverB = new ServerConstructor();

                await serverA.connect(params.server_test_store);
                await serverB.connect(params.server_test_store);

                graze.connect(serverA);

                (await graze.retrieve("temp/*")).length.should.equal(5);

                serverA.implode()()();

                graze.disconnect();

                await graze.connect(serverB);

                (await graze.retrieve("temp/*")).length.should.equal(0);

            })
        })

        describe("Advanced", function() {
            this.slow(2000);
            this.timeout(5000);

            let total = 0;

            before(async function() {
                graze.connect(server);
                await fillTestData(graze);
                await fillTestData(graze, "locfr");
                await fillTestData(graze, "pop2018");
                total = (await graze.retrieve("*")).length;
            })

            after(function() {
                graze.disconnect();
                server.implode()()();
            })

            async function getLen(query_string) {
                return (await graze.retrieve(query_string)).length;
            }

            async function getBody(query_string) {
                return (await graze.retrieve(query_string)).map(e => e.body);
            }

            async function getTags(query_string) {
                return (await graze.retrieve(query_string)).map(e => e.tags);
            }

            async function getNote(query_string) {
                return (await graze.retrieve(query_string));
            }


            describe("Wild Card *", function() {

                it("[ *                                    ]", async () => (await getLen("*")).should.equal(total));
                it("[ book 1/                              ]", async () => (await getLen("book 1/")).should.equal(1));
                it("[ book 1/*                             ]", async () => (await getLen("book 1/*")).should.equal(1141));
                it("[ */chapter */                         ]", async () => (await getLen("*/chapter */")).should.equal(11346));
                it("[ */chapter */ ? The dog               ]", async () => (await getLen("*/chapter */ ? The dog")).should.equal(1));
                it("[ */chapter */ ? squirrel              ]", async () => (await getLen("*/chapter */ ? squirrel")).should.equal(3));
                it("[ */chapter */ ? The dog or squirrel   ]", async () => (await getLen("*/chapter */ ? The dog or squirrel")).should.equal(4));
                it("[ */chapter 1*/ ? The dog or squirrel  ]", async () => (await getLen("*/chapter 1*/ ? The dog or squirrel")).should.equal(2));
                it("[ */chapter 2*/ ? The dog or squirrel  ]", async () => (await getLen("*/chapter 2*/ ? The dog or squirrel")).should.equal(0));
                it("[ */films/*                            ]", async () => (await getLen("*/films/*")).should.equal(750));
                it("[ */essays/*                           ]", async () => (await getLen("*/essays/*")).should.equal(314));
                it("[ */footnote *                         ]", async () => (await getLen("*/footnote *")).should.equal(123));
                it("[ */*pop*/* ? shrunk                   ]", async () => (await getLen("*/*pop*/* ? shrunk ")).should.equal(7));
                it("[ */*pop*/*                            ]", async () => (await getLen("*/*pop*/*  ")).should.equal(53));
                it("[ */*pop*/* ? #type=state              ]", async () => (await getLen("*/*pop*/* ? #type = state")).should.equal(50));
                it("[ */*pop*/* ? #type=territory          ]", async () => (await getLen("*/*pop*/* ? #type = territory")).should.equal(1));
                it("[ */*pop*/* ? #type=district           ]", async () => (await getLen("*/*pop*/* ? #type = district ")).should.equal(1));
                it("[ */*pop*/* ? #type=country            ]", async () => (await getLen("*/*pop*/* ? #type = country")).should.equal(1));
                it("[ * ? #*2010*sus                       ]", async () => (await getLen("* ? #*2010*sus")).should.equal(53));
            })

            describe("Filter", async function() {
                var a = 0;

                it("[ * ? * and *]", async function() {
                    a = (await getLen("* ? * and *"));
                    a.should.equal(total);
                });

                it("[ * ? ! * ]", async function() {
                    a = (await getLen("* ? ! *"));
                    a.should.not.equal(total);
                    a.should.equal(0);
                });

                it("[ * ? chapter ]", async function() {
                    a = (await getLen(" * ? chapter"));
                    a.should.not.equal(total);
                    a.should.equal(11346);
                });

                it("[ * ? not chapter ]", async function() {
                    const c = (await getLen(" * ? not chapter"));
                    c.should.not.equal(total);
                    c.should.equal(total - a);
                });

                it("[ * ? footnote ]", async function() {
                    a = (await getLen(" * ? footnote"));
                    a.should.not.equal(total);
                    a.should.equal(123);
                });

                it("[ * ? ! footnote ]", async function() {
                    const c = (await getLen(" * ? ! footnote"));
                    c.should.not.equal(total);
                    c.should.equal(total - a);
                });

                it("[ */*pop*/* ? #state ]", async function() {
                    a = (await getLen(" */*pop*/* ? state"));
                    a.should.not.equal(53);
                    a.should.equal(50);
                });

                it("[ */*pop*/* ? ! #state ]", async function() {
                    const c = (await getLen(" */*pop*/* ? ! state"));
                    c.should.not.equal(total);
                    c.should.equal(53 - a);
                });

                it("[ * ? #state or #footnote ]", async function() {
                    const c = (await getLen(" * ? #state or #footnote "));
                    c.should.not.equal(total);
                    c.should.equal(173);
                });
            })

            describe("Sort", function() {
                it("[ * ? #state sort #*2018* [ descending | ascending ] ]", async function() {
                    const c = (await getNote(" * ? #state sort #*2018* des"));
                    let v = Infinity;
                    c.map((e) => {
                        let p = e.tag["Population Estimate (as of July 1) - 2018"];
                        p.should.be.lessThan(v);
                        v = p;
                    })

                    const d = (await getNote(" * ? #state sort #*2018* asc"));
                    v = -Infinity;
                    d.map((e) => {
                        let p = e.tag["Population Estimate (as of July 1) - 2018"];
                        p.should.be.greaterThan(v);
                        v = p;
                    })
                });

                it("[ *pop*/* sort #type asc #*2018* ]", async function() {
                    const c = (await getNote(" */*pop*/* sort #type asc, #*2018* des"));
                    let v = Infinity;
                    c.length.should.equal(53);
                    c[0].tag.type.should.equal("country")
                    c[1].tag.type.should.equal("district")
                    for (let i = 2; i < 52; i++) {
                        const note = c[i]
                        let p = note.tag["Population Estimate (as of July 1) - 2018"];
                        p.should.be.lessThan(v);
                        v = p;
                    }
                    c[52].tag.type.should.equal("territory")
                });

                it("[ *book*/* sort created ]", async function() {
                    const c = (await getNote(" *book*/* sort created asc"));
                    let v = -Infinity;
                    c.length.should.equal(11363);
                    for (let i = 0; i < 11363; i++) {
                        const note = c[i]
                        let p = note.created;
                        p.should.be.least(v);
                        v = p;
                    }
                });
            })
        })

        describe("Updating", function() {

            let total = 0;

            let graze2 = new GrazeConstructor();

            beforeEach(async function() {
                graze.connect(server);
                graze[GRAZE_SYNC_RATE] = 100;
                graze2.connect(server);
                graze2[GRAZE_SYNC_RATE] = 100;
                graze.setAutoSync(GRAZE_SYNC_RATE, GRAZE_SYNC_INTERVAL_REF)
                graze2.setAutoSync(GRAZE_SYNC_RATE, GRAZE_SYNC_INTERVAL_REF)
                //await fillTestData(graze);
                //await fillTestData(graze, "locfr");
                //await fillTestData(graze, "pop2018");
                //total = (await graze.retrieve("*")).length;
            })

            afterEach(function() {
                graze.disconnect();
                server.implode()()();
                graze2.disconnect();
                graze2.sync_rate = null;
                graze.sync_rate = null;
            })

            it("auto update", async function() {

                this.slow(10000)
                this.timeout(20000);

                graze.sync_rate = null;

                const valA = "This note is going to be transformed here:; that is in the middle of this here note.";

                const valB = "(this is in the middle of the note!)";

                const valC = valA.slice(0, 42) + valB + valA.slice(42);

                const noteG = graze.createNote("autoupdate/mynote", "", valA);

                graze.should.not.equal(graze2);

                graze.sync();

                await sleep(200)

                const noteGd = (await graze2.retrieve("/autoupdate/mynote"))[0];

                noteGd.body.should.equal(valA);
                
                noteG.body = valC;

                graze.sync();

                await sleep(10);

                await sleep(1000);

                noteG.body.should.equal(valC);

                noteGd.body.should.equal(valC);
            })
            //*/
        })
    }
}
