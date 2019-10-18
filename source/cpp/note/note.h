
#pragma once

#include "../string/crdt.h"
#include "../string/search.h"
#include "../uid/uid.h"
#include "../tags/tags.h"
#include "../utils/stream.h"
#include "../compiler/compiler.h"
#include <vector>
#include <iostream>
#include <sstream>
#include <cstring>

namespace RUMINATE
{
	using namespace STRING;
	using namespace TAG;

	namespace NOTE
	{
		using std::wstring;
		using std::vector;

		typedef CharOp <OP_ID, OPChar<ASCII>> ASCII_OP;
		typedef OPString<ASCII_OP, OPBuffer<ASCII_OP>> JSCRDTString;

		class Note
		{

		private:
			virtual void serialize(std::ostream&) const = 0;
			virtual void deserialize(std::istream&) = 0;
		public:
			unsigned type = 0;

			TagContainer tags;

			UID uid;

			wstring id;

			time_t modified_time;

			bool SERIALIZED = false;

			Note(UID _uid = UID(), unsigned site = 0)
				:
				uid(_uid),
				id(L"")
			{}

			Note(unsigned char * data) {}

			virtual ~Note() {}

			virtual const wstring toJSONString() = 0;

			virtual bool fuzzySearchMatchFirst(const RUMINATE_COMMAND_NODES::parse_string&) = 0;

			virtual void updateBody(const RUMINATE_COMMAND_NODES::parse_string&) = 0;

			void updateTags(const RUMINATE_COMMAND_NODES::NOTE_TagList_n& tag_node) {
				tags.update(tag_node);
			}

			/**** Streaming Functions ****/
			friend std::ostream& operator << (std::ostream& stream, const Note & note) {
				note.serialize(stream);
				return stream;
			}

			friend Note & operator << (Note & note, std::istream& stream) {
				note.deserialize(stream);
				return note;
			}

			/**** End Streaming Functions ****/
			virtual const wstring id_name() const {
				unsigned id_start = 0, i = 0;

				while(i < id.size()) {
					i++;
					if(id[i] == L'/') id_start = i+1;
				}

				return id.substr(id_start);
			}
		};


		class CRDTNote : public Note
		{
		private:
		public:
			JSCRDTString body;
		private:
			virtual void serialize(std::ostream& stream) const {
				stream << uid;
				stream.write((char *)&type, sizeof(type));
				writeString(stream, id);
				stream.write((char *)&modified_time, sizeof(modified_time));
				stream << tags;
				stream << body;
			}

			virtual void deserialize(std::istream& stream) {
				uid << stream;
				stream.read((char *)&type, sizeof(type));
				readString(stream, id);
				stream.read((char *)&modified_time, sizeof(modified_time));
				tags << stream;
				body << stream;
			}

		public:
			CRDTNote(UID uid = UID(), unsigned site = 0) : Note(uid, site), body(site) {}
			virtual ~CRDTNote() {}

			virtual bool fuzzySearchMatchFirst(const RUMINATE_COMMAND_NODES::parse_string& string) {
				return STRING::fuzzySearchMatchFirst<JSCRDTString, wchar_t, RUMINATE_COMMAND_NODES::parse_string>(body, string);
			}

			virtual const wstring toJSONString() {
				wstring string = L"";

				string += L"{";

				string += L"\"uid\":";

				string += uid.toJSONString();

				string += L",\"id\":\"";

				string += id;

				string += L",\"body\":\"";

				string += body.getValue();

				string += L"\"}";

				return string;
			}

			virtual void updateBody(const RUMINATE_COMMAND_NODES::parse_string& body_string) {
				;
			}

		};

		static CRDTNote NullNote(NullUID, 0);
	}
}
