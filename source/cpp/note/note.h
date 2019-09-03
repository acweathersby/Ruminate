#include "../uid/uid.h"
#include "../tags/tags.h"

namespace ruminate {

	template <class Body>
	class Note {

		Tags * tags = NULL;

		Body * body = NULL;

		wstring * id = NULL;
		
		UID uid;
		
		time_t modified_time;

		bool SERIALIZED = false;

		Note(UID _uid, Tags * t, Body * b) 
			:
			uid(_uid),
			body(b),
			tags(t)
			{}	

		Note(unsigned char * data){}

		~Note(){
			if(!SERIALIZED){
				delete body;
				delete tags;
			}

			body = NULL;
			tags = NULL;
		}

		serialize(){};
	}
}
