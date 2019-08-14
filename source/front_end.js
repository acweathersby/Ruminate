import graze from "./graze.js";
import markdom from "./client/common/markdom.js";
import graze_json_server_constructor from "./server/json/server.js";

export const server = {
	json : graze_json_server_constructor
}

export const client = {
	markdom
}

export {graze}
