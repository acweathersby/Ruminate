#pragma once

#include <cstring>
#include "../compiler/nodes.h"
#include "../uid/uid.h"
#include "../note/note.h"
#include "../container/container.h"
#include "../database/base.h"
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

		template<class Note>
		bool compareTag(TagStatement* node, Note& note)
		{
			auto& tags = note.tags;

			Comparison* compare = node->compare;
			Identifier& id = *node->id;

			Tag * t = getMatchingTag(tags, *(id.list[0]));

			if(t) {
				if(compare) {
					auto& tag = *t;

					switch(compare->type) {
						case Comparison::ID : {
								cout << "TESTSTSTSTSTS " << endl;
								wstring tag_string = tag.getText();
								auto& list = compare->id->list;

								for (int i = 0; i < list.size(); i++)
									if(!fuzzySearchMatchFirst<wstring, wchar_t>(tag_string, *list[i]))
										return false;

								return true;
							};
							break;
						case Comparison::Value : {

							}
							break;
						case Comparison::MoreThan : {

							}
							break;
						case Comparison::LessThan : {

							}
							break;
						case Comparison::Range : {

							}
							break;
						case Comparison::Date : {

							}
							break;
					}
				} else
					return true;
			}

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

		template<class Note, class NoteString>
		bool compareIdentifier(Identifier* node, Note& note)
		{
			auto& note_string = note.body;
			auto& list = node->list;

			for (int i = 0; i < list.size(); i++)
				if(!fuzzySearchMatchFirst<NoteString, wchar_t>(note_string, *list[i]))
					return false;

			return true;
		}

		template<class Note, class NoteString>
		bool filter(Node* node, Note& note)
		{
			switch(node->type) {
				case NodeType::And : {

						cout << 1234567 <<endl;
						AndExpression* And = (AndExpression*)node;
						return filter<Note, NoteString>(And->left, note) && filter<Note, NoteString>(And->right, note);

					};
				case NodeType::Or : {
						OrExpression* Or = (OrExpression*)node;
						return filter<Note, NoteString>(Or->left, note) || filter<Note, NoteString>(Or->right, note);
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
						bool b =  compareIdentifier<Note, NoteString>((Identifier *)node, note);


						wcout << "test string " << "SDFS"<< b << endl;
						return b;
					};
				default : {
						return true;
					}
			}
		}



		//Filters out notes based on note content
		template<class Note, class NoteString>
		int filterNotes(FilterClause& filter_node, Note ** in, Note ** out, unsigned& note_count)
		{
			unsigned note_length = note_count;

			note_count = 0;

			for(int i = 0; i < note_length; i++) {

				auto note = *in[i];

				cout << 1234567 <<endl;
				if(filter<Note, NoteString>(filter_node.expr, note)) {
					out[note_count++] = &note;
				}

				cout << 1234567 <<endl;

			}




			return 0;
		}
	}
}
