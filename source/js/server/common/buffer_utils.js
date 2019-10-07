
const UID_BYTE_SIZE = 16;
const USE_LITTLE_ENDIAN = false;

/** Lays out JS string data into array buffer **/
function  stringToBuffer(array_buffer, offset, string, UTF16 = false)
{
	const local_buffer = new Uint8Buffer(array_buffer, offset, string.length);

	if(UTF16){

	}else
		for(let i = 0; i < length; i++)
			local_buffer[i] = string.charCodeAt(i);
}

/** Converts char string buffer into JS string**/
function bufferToString(array_buffer, offset, length, UTF16 = false){

	const local_buffer = new Uint8Buffer(array_buffer, offset, length);

	let string = "";

	if(UTF16){

	}else
		for(let i = 0; i < length; i++)
			string += String.fromCharCode(local_buffer[i]);
	
	return string;
}

function tagMapToTagString(tag_map){

	const list = [];

	for (const t of this[RUMINATE_NOTE_TAGS].entries())
		list.push(`${t[1].d?"!":""}${t[0]}${t[1].v?":"+t[1].v:""}`)

	return list.join(",");
}

/** Converts tag string into key value pairs stored in a Map **/
function tagStringToTagMap(tag_string_list) {
	if (!tag_string_list)
		return new Map;

	if (typeof tag_string_list == "string")
		tag_string_list = tag_string_list.split(",");

	return new Map(tag_string_list.map((t, p, tag) => (
		p = typeof t == "string" ? t.split(":") : [t + ""],
		tag = { v: undefined, d: false },
		tag.v = (p.length > 1)
		? isNaN(p[1])
		? p[1].trim()
		: parseFloat(p[1].trim())
		: undefined,
        [p[0].trim().toLowerCase(), tag]
	)));
}

function bufferFromNoteData(uid, id = "", tags = new Map, body = ""){
	const 
		tag_string = tagsToString(tags),
		body_length = body.length,
		tag_length = tag_string.length,
		id_length = id_string.length;

	const buffer_size = 
		UID_BYTE_SIZE +
		id_length + 4 +
		tag_length + 4 + 
		body_length + 4;

	const buffer = new ArrayBuffer(buffer_size), dv = new DataView(buffer);

	uid.toBuffer(buffer, 0);

	let offset = UID_BYTE_SIZE;

	//ID
	buffer.setUint32(offset, id_length, USE_LITTLE_ENDIAN);
	stringToBuffer(buffer, offset += 4, id);
	offset += id_length;

	//TAG
	buffer.setUint32(offset, tag_length, USE_LITTLE_ENDIAN);
	stringToBuffer(buffer, offset += 4, tag_string);
	offset += tag_length;

	//BODY
	buffer.setUint32(offset, body_length, USE_LITTLE_ENDIAN);
	stringToBuffer(buffer, offset += 4, body);
	offset += body_length;

	return buffer;
}

function noteDataFromBuffer(note_array_buffer){

	var tags = new Map, body, uid, id, modified_date, offset = UID_BYTE_SIZE;

	var dv = new DataView(note_array_buffer);

	uid = new UID(new Uint8Array(note_array_buffer, 0, UID_BYTE_SIZE));

	/***** Modified Date ******/

	modified_date = dv.getUint32(offset);

	offset += 4;

	/***** ID String ********/

	const id_string_length = dv.getUint32(offset, USE_LITTLE_ENDIAN);

	offset += 4;
	
	id = bufferToString(note_array_buffer, offset, id_string_length)
	
	offset += id_string_length;
	
	/***** TAGS *******/

	const tag_string_length = dv.getUint32(offset, USE_LITTLE_ENDIAN);

	offset += 4;

	if(tag_string_length > 0){

		const tag_string = bufferToString(note_array_buffer, offset, tag_string_length)
	
		tags = tagStringToTagMap(tag_string)

		offset += tag_string_length;
	}

	/***** Body *******/

	const body_string_length = dv.getUint32(offset, USE_LITTLE_ENDIAN);

	offset += 4;

	if(body_string_length > 0){

		const body_string = bufferToString(note_array_buffer, offset, body_string_length)
	
		body = body_string;

		offset += body_string_length;
	}

	return {uid, modified, id, tags, body};
}

const bufferToNote = noteFromBuffer;
const noteToBuffer = bufferFromNote;

export {
	bufferToNote,
	noteFromBuffer,
	noteToBuffer,
	bufferFromNote
}