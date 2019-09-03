import { fillTestData } from "./common.js";
import {
    RUMINATE_NOTE,
    RUMINATE_NOTES,
    RUMINATE_SYNC_RATE,
    RUMINATE_SYNC_INTERVAL_REF,
    RUMINATE_SERVER
} from "../source/common/symbols.js";
import UID from "../source/common/uid.js";

export default function ruminate_test_suite(RuminateConstructor, ServerConstructor, params) {
    return function() {
        const ruminate = new RuminateConstructor({ sync_rate: null });
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
                ruminate.connect(server);
                ruminate.sync_rate = null;
            })

            afterEach(function() {
                ruminate.disconnect();
                server.implode()()();
                ruminate.sync_rate = null;
                ruminate.purgeCache();
            })

            it("warning: empty test", function() {
                ruminate.should.not.be.undefined;
            })

            it(`connect to server`, function() {

                const ruminate = new RuminateConstructor();

                ruminate.should.have.property(RUMINATE_SERVER, null);

                ruminate.connect(server);

                ruminate[RUMINATE_SERVER].type.should.equal(params.server_id)

                ruminate.disconnect();

                ruminate.should.have.property(RUMINATE_SERVER, null);
            })

            it("create UID", async function() {

                const uid = ruminate.createUID();

                uid.length.should.equal(16);

                const note = await ruminate.createNote("Temp Name", "tagA, tagB, tagC", "Message");

                note.should.have.property("uid");

                note.uid.should.have.lengthOf(16);

                note.body.length.should.equal(7);

                const note2 = await ruminate.createNote("Temp Name", "tagA, tagB, tagC", "Message");

                note2.uid.length.should.equal(16);

                note2.uid.string.should.not.equal(note.uid.string);
            })

            it("store and retrieve - basic", async function() {

                const noteA = await ruminate.createNote("Temp Name A", "tagA, tagB, tagC", "Message A");
                const noteB = await ruminate.createNote("Temp Name B", "tagA, tagB, tagC", "Message B");
                await ruminate.sync();
                //await sleep(10);

                const noteAd = (await ruminate.retrieve(noteA.uid.string))[0];
                const noteBd = (await ruminate.retrieve(noteB.id))[0];

                noteB.body.should.equal(noteBd.body);
                noteA.body.should.equal(noteAd.body);
                noteA.body.should.not.equal(noteBd.body);

                noteA.uid.string.should.equal(noteAd.uid.string);
            })

            it("store and retrieve - collection", async function() {

                const noteA = await ruminate.createNote("temp/Temp Name A", "tagA, tagB, tagC", "Message A");
                const noteB = await ruminate.createNote("temp/Temp Name B", "tagA, tagB, tagC", "Message B");
                const noteC = await ruminate.createNote("temp/temp/Temp Name B", "tagA, tagB, tagC", "Message B");

                await ruminate.sync();

                const notes = await ruminate.retrieve("temp/");

                notes.length.should.equal(2);

                notes.sort(ruminate.sort_indexes.create_time)[0].body.should.equal(noteA.body);
                notes.sort(ruminate.sort_indexes.create_time)[1].body.should.equal(noteB.body);

                const notes2 = await ruminate.retrieve("temp/temp/");

                notes2.length.should.equal(1);

                notes2[0].body.should.equal(noteC.body);
            })

            it("store and retrieve - search", async function() {

                const noteA = await ruminate.createNote("temp/Temp Name A", "tagA, tagB, tagC", "Message A");
                const noteB = await ruminate.createNote("temp/Temp Name B", "tagA, tagB, tagC", "Message B");
                const noteC = await ruminate.createNote("temp/temp/Temp Name B", "tagA, tagB, tagC", "Message B");

                await ruminate.sync();

                const notes = await ruminate.retrieve("temp/*/Name *  ? Message B");

                notes.length.should.equal(2);

                notes[0].body.should.equal(noteC.body);
            })

            it("Renders note referenced inside another note", async function() {

                const noteG = await ruminate.createNote("temp/Temp Name A", "tagA, tagB, tagC", "inception");
                const noteA = await ruminate.createNote("temp/Temp Name A", "tagA, tagB, tagC", `inside ((${noteG.uid}))`);
                const noteB = await ruminate.createNote("temp/Temp Name B", "tagA, tagB, tagC", `referenced note text: ((${noteA.uid}))`);

                await ruminate.sync();
                //note does not need to be saved in order to take advantage of reference rendering.

                (await noteB.render()).should.equal("referenced note text: inside inception");
            })
            //*
            //it("warns if no server is connected to ruminate");

            it("Loads permanently stored data", async function() {
                this.slow(500);
                this.timeout(750);

                const serverA = new ServerConstructor();
                const serverB = new ServerConstructor();
                const serverC = new ServerConstructor();
                //Connect server to data store
                await serverA.connect(params.server_test_store);
                await serverC.connect(params.server_test_store);

                ruminate.disconnect();

                await ruminate.connect(serverA);

                await (ruminate.createNote("temp/tempA/Temp Name A", "tagA, tagB, tagC", "Test 1"));
                await (ruminate.createNote("temp/tempB/Temp Name B", "tagA, tagB, tagC", "Test 2"));
                await (ruminate.createNote("temp/tempC/Temp Name C", "tagA, tagB, tagC", "Test 3"));
                await (ruminate.createNote("temp/tempD/Temp Name D", "tagA, tagB, tagC", "Test 4"));
                await (ruminate.createNote("temp/tempE/Temp Name E", "tagA, tagB, tagC", "Test 5"));
                await ruminate.sync();
                ruminate.disconnect();

                await serverB.connect(params.server_test_store);

                ruminate.connect(serverB);

                (await ruminate.retrieve("temp/*")).length.should.equal(5);

                ruminate.disconnect();

                ruminate.connect(serverC);

                (await ruminate.retrieve("temp/tempE/")).length.should.equal(1);
                (await ruminate.retrieve("temp/*")).length.should.equal(5);
            })

            it("Server.implode dumps all data from store - **dependent on previous test**", async function() {

                const serverA = new ServerConstructor();
                const serverB = new ServerConstructor();

                await serverA.connect(params.server_test_store);
                await serverB.connect(params.server_test_store);

                ruminate.connect(serverA);

                (await ruminate.retrieve("temp/*")).length.should.equal(5);

                serverA.implode()()();

                ruminate.disconnect();

                await ruminate.connect(serverB);

                (await ruminate.retrieve("temp/*")).length.should.equal(0);

            })
        })

        describe.only("Advanced", function() {
            this.slow(200000);
            this.timeout(500000);

            let total = 0;

            before(async function() {
                ruminate.connect(server);
                await fillTestData(ruminate);
                await fillTestData(ruminate, "locfr");
                await fillTestData(ruminate, "pop2018");
                total = (await ruminate.retrieve("*")).length;
            })

            after(function() {
                ruminate.disconnect();
                server.implode()()();
            })

            async function getLen(query_string) {
                return (await ruminate.retrieve(query_string)).length;
            }

            async function getBody(query_string) {
                return (await ruminate.retrieve(query_string)).map(e => e.body);
            }

            async function getTags(query_string) {
                return (await ruminate.retrieve(query_string)).map(e => e.tags);
            }

            async function getNote(query_string) {
                return (await ruminate.retrieve(query_string));
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

            let ruminate2 = new RuminateConstructor();

            beforeEach(async function() {
                ruminate.connect(server);
                ruminate[RUMINATE_SYNC_RATE] = 100;
                ruminate2.connect(server);
                ruminate2[RUMINATE_SYNC_RATE] = 100;
                ruminate.setAutoSync(RUMINATE_SYNC_RATE, RUMINATE_SYNC_INTERVAL_REF)
                ruminate2.setAutoSync(RUMINATE_SYNC_RATE, RUMINATE_SYNC_INTERVAL_REF)
                //await fillTestData(ruminate);
                //await fillTestData(ruminate, "locfr");
                //await fillTestData(ruminate, "pop2018");
                //total = (await ruminate.retrieve("*")).length;
            })

            afterEach(function() {
                ruminate.disconnect();
                server.implode()()();
                ruminate2.disconnect();
                ruminate2.sync_rate = null;
                ruminate.sync_rate = null;
            })

            it("auto update", async function() {

                this.slow(10000)
                this.timeout(20000);

                ruminate.sync_rate = null;

                const valA = "This note is going to be transformed here:; that is in the middle of this here note.";

                const valB = "(this is in the middle of the note!)";

                const valC = valA.slice(0, 42) + valB + valA.slice(42);

                const noteG = ruminate.createNote("autoupdate/mynote", "", valA);

                ruminate.should.not.equal(ruminate2);

                ruminate.sync();

                await sleep(200)

                const noteGd = (await ruminate2.retrieve("/autoupdate/mynote"))[0];

                noteGd.body.should.equal(valA);
                
                noteG.body = valC;

                ruminate.sync();

                await sleep(10);

                await sleep(1000);

                noteG.body.should.equal(valC);

                noteGd.body.should.equal(valC);
            })
            //*/
        })
    }
}
