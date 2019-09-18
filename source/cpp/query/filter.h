#pragma once

#include <cstring>
#include "../compiler/nodes.h"
#include "../uid/uid.h"
#include "../note/note.h"
#include "../container/container.h"
#include "../database/base.h"
//#include "./container.h"

namespace RUMINATE
{
	using namespace CONTAINER;
	using namespace DB;

	namespace QUERY
	{

		using namespace RUMINATE_QUERY_NODES;

		using HC_Tokenizer::Token;
		using HC_Parser::parse;
		using namespace HC_TEMP;

		template<class Note>
		bool compareTag(TagStatement* node, Note& note)
		{
			return false;
		}
		template<class Note>
		bool compareSize(SizeStatement* node, Note& note)
		{
			return false;
		}

		template<class Note>
		bool compareDateCreated(CreatedStatement* node, Note& note)
		{
			return false;
		}

		template<class Note>
		bool compareDateModified(ModifiedStatement* node, Note& note)
		{
			return false;
		}

		template<class Note>
		bool compareIdentifier(Identifier* node, Note& note)
		{
			auto& note_string = note.body;
			auto& tags = note.tags;
			auto& list = node->list;

			wcout << list << endl;


			wcout << "test string " << note_string[1] << endl;

			return true;


		}

		template<class Note>
		bool filter(Node* node, Note& note)
		{
			switch(node->type) {
				case NodeType::And : {
						AndExpression* And = (AndExpression*)node;
						return filter<Note>(And->left, note) && filter<Note>(And->right, note);
					};
				case NodeType::Or : {
						OrExpression* Or = (OrExpression*)node;
						return filter<Note>(Or->left, note) || filter<Note>(Or->right, note);
					};
				case NodeType::SizeStatement : {
						return compareSize<Note>((SizeStatement *)node, note);
					};
				case NodeType::CreatedStatement : {
						return compareDateCreated<Note>((CreatedStatement *)node, note);
					};
				case NodeType::ModifiedStatement : {
						return compareDateModified<Note>((ModifiedStatement *)node, note);
					};
				case NodeType::TagStatement : {
						return compareTag<Note>((TagStatement *)node, note);
					};
				case NodeType::ID : {
						return compareIdentifier<Note>((Identifier *)node, note);
					};
				default : {
						return true;
					}
			}
		}



		//Filters out notes based on note content
		template<class Note>
		int filterNotes(FilterClause& filter_node, Note ** in, Note ** out, unsigned& note_count)
		{
			unsigned note_length = note_count;

			note_count = 0;

			for(int i = 0; i < note_length; i++) {

				auto note = *in[i];

				if(filter<Note>(filter_node.expr, note)) {
					out[note_count++] = &note;
				}
			}

			return 0;
		}
	}
}
