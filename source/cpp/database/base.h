#pragma once
#include <unordered_map>
#include "../uid/uid.h"
#include "../container/container.h"

namespace RUMINATE
{
	using namespace CONTAINER;
	namespace DB
	{
		template<class Note>
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

			virtual Note * getNote(const UID& uid) const = 0;

			virtual const ContainerLU<Note>& getContainerTree() const = 0;

			virtual void close() = 0;
		};
	}
}
