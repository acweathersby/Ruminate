#include <time.h> 
#include <cstdlib> 
#include <time.h>

namespace ruminate {

	/**
		For Ruminate objects needing a unique identifier. 
	**/

	struct UID{
		
		time_t created_time;
		
		unsigned char magic = 0b10011001;

		unsigned random = 0;

		UID() : random(rand()){
			time(&created_time);
		}
	}
}
