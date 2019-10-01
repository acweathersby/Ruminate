#pragma once

#include <iostream>
#include <cstring>
#include <vector>
#include "../uid/uid.h"
#include "../tags/tags.h"
#include "../utils/stream.h"

namespace RUMINATE
{
	namespace NOTE
	{
		using namespace TAG;
		using std::wstring;
		using std::vector;

		template <class Body>
		class Note
		{

		public:
			unsigned type = 0;

			TagContainer tags;

			Body body;

			UID uid;

			wstring id;

			time_t modified_time;

			bool SERIALIZED = false;

			Note(UID _uid = UID(), unsigned site = 0)
				:
				body(site),
				uid(_uid),
				id(L"")
			{}

			Note(unsigned char * data) {}

			~Note() {}
			/**** Streaming Functions ****/
			friend std::ostream& operator << (std::ostream& stream, const Note & note) {
				stream << note.uid;
				stream.write((char *)&note.type, sizeof(note.type));
				writeString(stream, note.id);
				stream.write((char *)&note.modified_time, sizeof(note.modified_time));
				stream << note.tags;
				stream << note.body;
				return stream;
			}

			friend Note & operator << (Note & note, std::istream& stream) {
				note.uid << stream;
				stream.read((char *)&note.type, sizeof(note.type));
				readString(stream, note.id);
				stream.read((char *)&note.modified_time, sizeof(note.modified_time));
				note.tags << stream;
				note.body << stream;
				return note;
			}
			/**** End Streaming Functions ****/
			const wstring id_name() const {
				unsigned id_start = 0, i = 0;

				while(i < id.size()) {
					i++;
					if(id[i] == L'/') id_start = i+1;
				}

				return id.substr(id_start);
			}

			const wstring toJSONString() {
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
		};
	}
}
