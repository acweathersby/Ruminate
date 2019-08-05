import chai from "chai";
import graze_constructor from "../source/graze.js";
import path from "path";
import fs from "fs";

const fsp = fs.promises;

chai.should();

/*********************** UTILITY TESTS *************************************/

import utility_tests from "./utility_test.js";

describe("Graze Utilites", utility_tests)

/*********************** SERVER BACKED TESTS *******************************/

import graze_test_suite from "./server_test.js";
import graze_json_server_constructor from "../source/server/json/server.js";
import graze_fs_server_constructor from "../source/server/fs/server.js";
import graze_mongo_server_constructor from "../source/server/mongo/server.js";
import graze_couchdb_server_constructor from "../source/server/couchdb/server.js";

describe.only("JSON FILE BACKED", graze_test_suite(graze_constructor, graze_json_server_constructor, {
    type: "JSON BACKED",
    server_id: "JSONDB",
    server_test_store: "./test/test.json"
}))
/*
describe("FILE SYSTEM - !!! DANGEROUS !!! ", graze_test_suite(graze_constructor, graze_fs_server_constructor, {
    type: "FILE SYSTEM",
    server_id: "FSDB",
    server_test_store: "./test/test.json"
}))

describe("MONGO DATABASE", graze_test_suite(graze_constructor, graze_mongo_server_constructor, {
    type: "MONGO DATABASE",
    server_id: "MONGODB",
    server_test_store: "./test/test.json"
}))

describe("COUCHDB DATABASE", graze_test_suite(graze_constructor, graze_couchdb_server_constructor, {
    type: "COUCHDB DATABASE",
    server_id: "COUCHDB",
    server_test_store: "./test/test.json"
}))
*/