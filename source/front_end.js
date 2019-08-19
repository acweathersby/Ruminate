import ruminate from "./ruminate.js";
import markdom from "./client/common/markdom.js";
import ruminate_json_server_constructor from "./server/json/server.js";

export const server = {
	json : ruminate_json_server_constructor
}

export const client = {
	markdom
}

export {ruminate}
