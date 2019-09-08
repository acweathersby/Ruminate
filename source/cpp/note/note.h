#pragma once

#include <cstring>
#include "../uid/uid.h"
#include "../tags/tags.h"


namespace RUMINATE
{

	namespace NOTE
	{
		using namespace TAG;
		using namespace std;

		struct ContainerID {

			wstring id;

			vector<wstring> ids;

			char size = 0;

			wstring operator [] (int i) {
				return ids[i];
			}
		};

		template <class Body>
		class Note
		{

		public:
			UID uid;

			wstring id;

			Body * body = NULL;

			Tags * tags;

			time_t modified_time;

			bool SERIALIZED = false;

			Note(UID _uid, Tags * t = nullptr, Body * b = nullptr)
				:
				uid(_uid),
				body(b),
				tags(t)
			{}

			Note(unsigned char * data) {}

			~Note() {
				if(!SERIALIZED) {
					delete body;
					delete tags;
				}

				body = NULL;
				tags = NULL;
			}

			void serialize() {};
		};
	}
}
