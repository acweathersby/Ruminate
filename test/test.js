import ruminate_constructor from "../source/ruminate.js";

import chai from "chai";

chai.should();

/*********************** Markdom TESTS *************************************/

//import markdom_tests from "./markdom_test.js";

//describe("MarkDOM", markdom_tests)


/*********************** UTILITY TESTS *************************************/

//import utility_tests from "./utility_test.js";

//describe("Utilites", utility_tests)

/*********************** NOTE TESTS *************************************/

import note_test from "./note_test.js";

describe("Note",note_test(ruminate_constructor))

/*********************** SERVER BACKED TESTS *******************************/

import ruminate_test_suite from "./server_test.js";
import ruminate_json_server_constructor from "../source/server/json/server.js";
import ruminate_fs_server_constructor from "../source/server/fs/server.js";
import ruminate_mongo_server_constructor from "../source/server/mongo/server.js";
import ruminate_couchdb_server_constructor from "../source/server/couchdb/server.js";

describe("JSON File Backed", ruminate_test_suite(ruminate_constructor, ruminate_json_server_constructor, {
    type: "JSON BACKED",
    server_id: "JSONDB",
    server_test_store: "./test/test.json"
}))
/*
describe("FILE SYSTEM - !!! DANGEROUS !!! ", ruminate_test_suite(ruminate_constructor, ruminate_fs_server_constructor, {
    type: "FILE SYSTEM",
    server_id: "FSDB",
    server_test_store: "./test/test.json"
}))

describe("MONGO DATABASE", ruminate_test_suite(ruminate_constructor, ruminate_mongo_server_constructor, {
    type: "MONGO DATABASE",
    server_id: "MONGODB",
    server_test_store: "./test/test.json"
}))

describe("COUCHDB DATABASE", ruminate_test_suite(ruminate_constructor, ruminate_couchdb_server_constructor, {
    type: "COUCHDB DATABASE",
    server_id: "COUCHDB",
    server_test_store: "./test/test.json"
}))
*/
