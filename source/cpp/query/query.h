#include "../uid/uid.h"
#include "../tags/tags.h"

namespace ruminate {

	enum query_type {
		TAG
		CREATED
		MODIFIED
		SIZE
		AND
		OR
		NOT
		MATCH
	}

	struct QueryNode {
		query_type type;
		unsigned order = 0;
	}

	struct TagNode : public QueryNode {
		wstring * id;
		unsigned id_length = 0;

		wstring * val;
		unsigned val_length = 0;
	}


	matchQuery(){

	}
}
