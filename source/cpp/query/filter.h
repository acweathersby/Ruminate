#pragma once

#include <cstring>
#include "../compiler/nodes.h"
#include "../uid/uid.h"
#include "../note/note.h"
#include "../container/container.h"
#include "../database/db_runner.h"
#include "../string/search.h"
//#include "./container.h"



namespace RUMINATE
{
	using namespace CONTAINER;
	using namespace DB;
	using namespace STRING;
	using namespace TAG;

	namespace QUERY
	{

		using namespace RUMINATE_QUERY_NODES;

		using HC_Tokenizer::Token;
		using HC_Parser::parse;
		using namespace HC_TEMP;

		static bool compareDouble(Comparison& compare, double d)
		{
			switch(compare.type) {
				case Comparison::Value : {
						return compare.valueA == d;
					}
					break;
				case Comparison::MoreThan : {
						return compare.valueA > d;
					}
					break;
				case Comparison::LessThan : {
						return compare.valueA < d;
					}
					break;
				case Comparison::Range : {
						return compare.valueA <= d && d <= compare.valueB;
					}
					break;
				case Comparison::ID : return false;
				case Comparison::Date : return false;
			}
			return false;
		}

		static bool compareTag(TagStatement* node, Note& note)
		{
			auto& tags = note.tags;

			Comparison* compare = node->compare;
			Identifier& id = *node->id;

			Tag * t = getMatchingTag(tags, *(id.list[0]));

			if(t) {
				if(compare) {
					auto& tag = *t;
					auto& v = tag.val;

					if(compare->type == Comparison::ID) {
						wstring* tag_string = v;
						auto& list = compare->id->list;
						for (int i = 0; i < list.size(); i++)
							if(!fuzzySearchMatchFirst<wstring, wchar_t>(*tag_string, *list[i]))
								return false;
						return true;
					}

					if(v.isDouble()) {
						if(compare->type == Comparison::Date) {

						} else
							return compareDouble(*compare, v);
					}
				} else
					return true;
			}

			return false;
		}

		static bool compareSize(SizeStatement* node, Note& note)
		{
			return false;
			//return compareDouble(*node->compare, double(note.size));
		}

		static bool compareDateCreated(CreatedStatement* node, Note& note)
		{
			return compareDouble(*node->compare, double(note.uid.created_time));
		}

		static bool compareDateModified(ModifiedStatement* node, Note& note)
		{
			return compareDouble(*node->compare, double(note.modified_time));
		}

		static bool compareIdentifier(Identifier* node, Note& note)
		{
			auto& list = node->list;

			for (int i = 0; i < list.size(); i++)
				if(!note.fuzzySearchMatchFirst(*list[i]))
					return false;

			return true;
		}


		static bool filter(Node* node, Note& note)
		{
			switch(node->type) {
				case NodeType::And : {
						AndExpression* And = (AndExpression*)node;
						return filter(And->left, note) && filter(And->right, note);
					};
				case NodeType::Or : {
						OrExpression* Or = (OrExpression*)node;
						return filter(Or->left, note) || filter(Or->right, note);
					};
				case NodeType::SizeStatement : {
						return compareSize((SizeStatement *)node, note);
					};
				case NodeType::CreatedStatement : {
						return compareDateCreated((CreatedStatement *)node, note);
					};
				case NodeType::ModifiedStatement : {
						return compareDateModified((ModifiedStatement *)node, note);
					};
				case NodeType::TagStatement : {
						return compareTag((TagStatement *)node, note);
					};
				case NodeType::ID : {
						return compareIdentifier((Identifier *)node, note);
					};
				default : {
						return true;
					}
			}
		}

		//Filters out notes based on note content
		static int filterNotes(FilterClause& filter_node, DBRunner& db, UID * in, UID * out, unsigned& note_count)
		{
			unsigned note_length = note_count;

			note_count = 0;

			for(int i = 0; i < note_length; i++) {

				auto note = db.getNote(in[i]);

				if(filter(filter_node.expr, *note))
					out[note_count++] = note->uid;
			}
			return 0;
		}
	}
}
