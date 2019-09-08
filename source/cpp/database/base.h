#pragma once
#include <unordered_map>
#include "../uid/uid.h"

namespace RUMINATE
{

	namespace DB
	{
		template<class Note>
		class NoteDB
		{
		public:

			std::unordered_map<UID, Note *> notes;

			NoteDB() {};

			~NoteDB() {};

			void addNote(Note * note) {
				notes.insert( {note->uid, note});
			}

			Note* getNote(UID& uid) {
				auto iter = notes.find(uid);

				if(iter != notes.end())
					return iter->second;

				return nullptr;

			}
		};
	}
}
