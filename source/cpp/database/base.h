#pragma once
#include <utility>
#include <unordered_map>
#include "../uid/uid.h"
#include "../container/container.h"

namespace RUMINATE
{
	using namespace CONTAINER;
	using namespace NOTE;
	namespace DB
	{

		typedef std::pair<unsigned long long, wstring> NoteBrief; // Used for a modified date and container string.
		typedef std::unordered_map<UID,NoteBrief> NoteLU; // Lookup used to determine the mapping of a particular UID to a modified time;

		class NoteDB
		{
		public:

			NoteDB() {};

			virtual ~NoteDB() {};

			/* Things needed in a data base */

			/*
			 * 1. Store note objects
			 * 2. Uniform retrieval of notes through UID. Support multi thread note retrieval
			 * 3. Rendering of container tree for client consumption.
			 * 4. Update client of store changes. Update ContainerLU with new notes / note changes
			 * 6. Handle concurent changes.
			 * 5. Optional - Create appropriate indice lookups for expedited note retrival
			 */

			virtual bool addNote(Note&) = 0;

			virtual Note * getNote(UID, const NoteLU&) = 0;

			virtual void MergeNoteLU (NoteLU&, ContainerLU&) = 0;
		};
	}
}
