#pragma once

#include "../compiler/nodes.h"
#include "../container/container.h"
#include "../database/include/db_runner.h"
#include "../note/note.h"
#include "../string/search.h"
#include "../uid/uid.h"
#include <cstring>
//#include "./container.h"


namespace RUMINATE
{
    using namespace CONTAINER;
    using namespace DB;
    using namespace STRING;
    using namespace TAG;

    namespace QUERY
    {

        using namespace RUMINATE_COMMAND_NODES;

        static bool compareDouble(QUERY_Comparison_n & compare, double d)
        {
            switch (compare.type) {
            case QUERY_Comparison_n::Value: {
                return compare.valueA == d;
            } break;
            case QUERY_Comparison_n::MoreThan: {
                return compare.valueA > d;
            } break;
            case QUERY_Comparison_n::LessThan: {
                return compare.valueA < d;
            } break;
            case QUERY_Comparison_n::Range: {
                return compare.valueA <= d && d <= compare.valueB;
            } break;
            case QUERY_Comparison_n::ID:
                return false;
            case QUERY_Comparison_n::Date:
                return false;
            }
            return false;
        }

        static bool compareTag(QUERY_Tag_n * node, Note & note)
        {
            auto & tags = note.tags;

            QUERY_Comparison_n * compare = node->compare;
            QUERY_Identifier_n & id      = *node->id;

            Tag * t = getMatchingTag(tags, *(id.list[0]));

            if (t) {

                if (compare) {
                    auto & tag = *t;
                    auto & v   = tag.val;

                    if (compare->type == QUERY_Comparison_n::ID) {
                        auto & list = compare->id->list;
                        for (int i = 0; i < list.size(); i++) {
                            if (!fuzzySearchMatchFirst<wstring, wchar_t, parse_string>(*v, *list[i])) return false;
                        }
                        return true;
                    }

                    if (v.isDouble()) {
                        if (compare->type == QUERY_Comparison_n::Date) {

                        } else
                            return compareDouble(*compare, v);
                    }
                } else
                    return true;
            }

            return false;
        }

        static bool compareSize(QUERY_Size_n * node, Note & note)
        {
            return false;
            // return compareDouble(*node->compare, double(note.size));
        }

        static bool compareDateCreated(QUERY_Created_n * node, Note & note)
        {
            return compareDouble(*node->compare, double(note.uid.created_time));
        }

        static bool compareDateModified(QUERY_Modified_n * node, Note & note)
        {
            return compareDouble(*node->compare, double(note.modified_time));
        }

        static bool compareIdentifier(QUERY_Identifier_n * node, Note & note)
        {
            auto & list = node->list;

            for (int i = 0; i < list.size(); i++)
                if (!note.fuzzySearchMatchFirst(*list[i])) return false;

            return true;
        }


        static bool filter(Node * node, Note & note)
        {
            switch (node->type) {
            case NodeType::And: {
                QUERY_And_n * And = (QUERY_And_n *) node;
                return filter(And->left, note) && filter(And->right, note);
            };
            case NodeType::Or: {
                QUERY_Or_n * Or = (QUERY_Or_n *) node;
                return (filter(Or->left, note) || filter(Or->right, note));
            };
            case NodeType::SizeStatement: {
                return compareSize((QUERY_Size_n *) node, note);
            };
            case NodeType::CreatedStatement: {
                return compareDateCreated((QUERY_Created_n *) node, note);
            };
            case NodeType::ModifiedStatement: {
                return compareDateModified((QUERY_Modified_n *) node, note);
            };
            case NodeType::TagStatement: {
                return compareTag((QUERY_Tag_n *) node, note);
            };
            case NodeType::ID: {
                return compareIdentifier((QUERY_Identifier_n *) node, note);
            };
            default: {
                return false;
            }
            }
        }

        // Filters out notes based on note content
        static int filterNotes(QUERY_Filter_n & filter_node, DBRunner & db, UID * in, UID * out, unsigned & note_count)
        {
            unsigned note_length = note_count;

            note_count = 0;

            for (int i = 0; i < note_length; i++) {

                auto note = db.getNote(in[i]);

                if (filter(filter_node.expr, *note)) out[note_count++] = note->uid;
            }
            return 0;
        }
    } // namespace QUERY
} // namespace RUMINATE
