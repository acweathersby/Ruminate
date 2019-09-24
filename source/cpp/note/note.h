#pragma once

#include <cstring>
#include <vector>
#include "../uid/uid.h"
#include "../tags/tags.h"


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
			TagContainer tags;

			Body body;

			UID uid;

			wstring id;

			time_t modified_time;

			bool SERIALIZED = false;

			Note(UID _uid, unsigned site = 0)
				:
				body(site),
				uid(_uid)
			{}

			Note(unsigned char * data) {}

			~Note() {}

			void serialize() {};

			const wstring id_name() const {
				unsigned id_start = 0, i = 0;

				while(i < id.size()) {
					i++;
					if(id[i] == L'/') id_start = i+1;
				}

				return id.substr(id_start);
			}
		};
	}
}
