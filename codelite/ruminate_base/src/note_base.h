#pragma once

namespace RUMINATE
{
	/* Note provides the bas data structures for dealing with small note datums. Notes can be different types, but they all must serialize simularly, with RUMI UID information, and note version information, which also doubles as the type information for the note. */
	namespace NOTE
	{

		class note_base
		{
		public:
			note_base() {
			}
			virtual ~note_base() {
			}

		};

	}

}
