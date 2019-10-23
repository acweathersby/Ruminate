#pragma once

#include <cstring>
#include <iostream>
#include <iterator>
#include <string>
#include <vector>

#include "./node_utils.h"
#include "./parse_buffer.h"
#include "./tokenizer.h"

namespace RUMINATE_COMMAND_NODES {
    typedef std::basic_string<wchar_t, std::char_traits<wchar_t>,
                              ParseBuffer<wchar_t>>
        parse_string;
}

#include "./command_nodes.h"
#include "./node.h"
#include "./note_nodes.h"
#include "./query_nodes.h"
#include "./uid_nodes.h"

namespace RUMINATE_COMMAND_NODES {
    using namespace HC_Tokenizer;

    struct NodeFunctions {

        /* ***********
    /  ************ Note Nodes */
        static void * NOTE_Note(Token & tk, unsigned reduce_size, unsigned bitfield,
                                int output_offset, void ** output,
                                ParseBuffer<char> * allocator) {
            OptionalNodes<void *, QUERY_Container_n *, void *, NOTE_TagList_n *, void *,
                          parse_string *>
                options(bitfield, output_offset, output);

            unsigned type =
                (options.a != nullptr) ? (unsigned) (*((double *) (options.a))) : 0;

            return new (*allocator) NOTE_Note_n(type, options.b, options.d, options.f);
        }

        static void * NOTE_TagList(Token & tk, unsigned reduce_size, unsigned bitfield,
                                   int output_offset, void ** output,
                                   ParseBuffer<char> * allocator) {
            NOTE_TagList_n * ctr = nullptr;

            if (reduce_size == 1) {
                ctr = new (*allocator) NOTE_TagList_n(*allocator);
                ctr->push_back((NOTE_Tag_n *) output[output_offset]);
            } else {
                ctr = (NOTE_TagList_n *) output[output_offset];
                ctr->push_back((NOTE_Tag_n *) output[output_offset + 2]);
            }

            return ctr;
        }

        static void * NOTE_TagNumber(Token & tk, unsigned reduce_size,
                                     unsigned bitfield, int output_offset,
                                     void ** output, ParseBuffer<char> * allocator) {
            OptionalNodes<parse_string *, void *, double> options(bitfield, output_offset,
                                                                  output);

            return new (*allocator) NOTE_Tag_n(options.a, options.c);
        }

        static void * NOTE_TagString(Token & tk, unsigned reduce_size,
                                     unsigned bitfield, int output_offset,
                                     void ** output, ParseBuffer<char> * allocator) {
            OptionalNodes<parse_string *, void *, parse_string *> options(
                bitfield, output_offset, output);
            return new (*allocator) NOTE_Tag_n(options.a, options.c);
        }

        static void * NOTE_Tag(Token & tk, unsigned reduce_size, unsigned bitfield,
                               int output_offset, void ** output,
                               ParseBuffer<char> * allocator) {
            OptionalNodes<parse_string *> options(bitfield, output_offset, output);
            return new (*allocator) NOTE_Tag_n(options.a);
        }

        static void * NOTE_String(Token & tk, unsigned reduce_size, unsigned bitfield,
                                  int output_offset, void ** output,
                                  ParseBuffer<char> * allocator) {
            unsigned start = (unsigned long long) output[output_offset],

                     end = tk.offset;

            parse_string * str = new (*allocator)
                parse_string(tk.string.substr(start, end - start), *allocator);

            return str;
        }

        /************
  / ************ UID Nodes */
        static void * UID_List(Token & tk, unsigned reduce_size, unsigned bitfield,
                               int output_offset, void ** output,
                               ParseBuffer<char> * allocator) {
            UID_List_n * ctr = nullptr;

            if (reduce_size == 1) {
                ctr = new (*allocator)
                    UID_List_n(*(new (*allocator) UIDVector(*allocator)));
                ctr->uids.push_back((UID_UID_n *) output[output_offset]);
            } else {
                ctr = (UID_List_n *) output[output_offset];
                ctr->uids.push_back((UID_UID_n *) output[output_offset + 2]);
            }

            return ctr;
        }

        static void * UID_UID(Token & tk, unsigned reduce_size, unsigned bitfield,
                              int output_offset, void ** output,
                              ParseBuffer<char> * allocator) {
            OptionalNodes<void *, void *, unsigned long long, void *, unsigned> options(
                bitfield, output_offset, output);

            unsigned random               = options.e;
            unsigned long long time_stamp = options.c;

            return new (*allocator) UID_UID_n(random, time_stamp);
        }

        static void * UID_Created(Token & tk, unsigned reduce_size, unsigned bitfield,
                                  int output_offset, void ** output,
                                  ParseBuffer<char> * allocator) {
            unsigned start = (unsigned long long) output[output_offset], end = tk.offset;

            try {
                ((unsigned long long *) output)[output_offset] =
                    stoull(tk.string.substr(start, end - start), nullptr, 16);
            } catch (std::invalid_argument & e) {
                ((unsigned long long *) output)[output_offset] = 0;
            }

            return output[output_offset];
        }

        static void * UID_Random(Token & tk, unsigned reduce_size, unsigned bitfield,
                                 int output_offset, void ** output,
                                 ParseBuffer<char> * allocator) 
        {
            unsigned start = (unsigned long long) output[output_offset], end = tk.offset;
            try {
                ((unsigned long long *) output)[output_offset] =
                    stoul(tk.string.substr(start, end - start), nullptr, 16);
            } catch (std::invalid_argument & e) {
                ((unsigned long long *) output)[output_offset] = 0;
            }

            return output[output_offset];
        }

        /*
          Command Nodes 
        */
        static void * COMMAND_Add(Token & tk, unsigned reduce_size, unsigned bitfield,
                                  int output_offset, void ** output,
                                  ParseBuffer<char> * allocator) 
        {
            OptionalNodes<void *, Node *, void *, NOTE_Note_n *> options(
                bitfield, output_offset, output);
            if (options.b) {
                if (options.b->type == NodeType::UID)
                    return new (*allocator) COMMAND_Add_n((UID_UID_n *) options.b, options.d);
                else
                    return new (*allocator)
                        COMMAND_Add_n((QUERY_Container_n *) options.b, options.d);
            } else
                return new (*allocator) COMMAND_Add_n(options.d);
        }

        static void * COMMAND_Delete(Token & tk, unsigned reduce_size,
                                     unsigned bitfield, int output_offset,
                                     void ** output, ParseBuffer<char> * allocator) {
            OptionalNodes<void *, Node *> options(bitfield, output_offset, output);

            if (options.b->type == NodeType::UID_LIST)
                return new (*allocator) COMMAND_Delete_n((UID_List_n *) options.b);
            else
                return new (*allocator) COMMAND_Delete_n((QUERY_Body_n *) options.b);
        }

        static void * COMMAND_Retrieve(Token & tk, unsigned reduce_size,
                                       unsigned bitfield, int output_offset,
                                       void ** output, ParseBuffer<char> * allocator) {
            OptionalNodes<void *, Node *> options(bitfield, output_offset, output);

            if (options.b->type == NodeType::UID_LIST)
                return new (*allocator) COMMAND_Retrieve_n((UID_List_n *) options.b);
            else
                return new (*allocator) COMMAND_Retrieve_n((QUERY_Body_n *) options.b);
        }

        /* ***********
  / ************ QUERY STRING NODES

  / ****************************/
        static void * QUERY_Body(Token & tk, unsigned reduce_size, unsigned bitfield,
                                 int output_offset, void ** output,
                                 ParseBuffer<char> * allocator) {
            OptionalNodes<QUERY_Container_n *, QUERY_Filter_n *, QUERY_Sort_n *> options(
                bitfield, output_offset, output);

            return new (*allocator) QUERY_Body_n(options.a, options.b, options.c);
        }

        static void * QUERY_SortList(Token & tk, unsigned reduce_size,
                                     unsigned bitfield, int output_offset,
                                     void ** output, ParseBuffer<char> * allocator) {
            QUERY_SortList_n * ctr = NULL;

            if (reduce_size == 1) {
                ctr = new (*allocator) QUERY_SortList_n(*allocator);
                ctr->push_back((Node *) output[output_offset]);
            } else {
                ctr = (QUERY_SortList_n *) output[output_offset];
                ctr->push_back((Node *) output[output_offset + 2]);
            }

            return ctr;
        }

        /**** CLAUSES ****/
        static void * QUERY_Container(Token & tk, unsigned reduce_size,
                                      unsigned bitfield, int output_offset,
                                      void ** output, ParseBuffer<char> * allocator) {
            OptionalNodes<int, QUERY_ContainerIdentifierList_n *,
                          struct QUERY_Identifier_n *>
                options(bitfield, output_offset, output);

            return new (*allocator) struct QUERY_Container_n(options.b, options.c);
        }

        static void * QUERY_Filter(Token & tk, unsigned reduce_size, unsigned bitfield,
                                   int output_offset, void ** output,
                                   ParseBuffer<char> * allocator) {
            OptionalNodes<int, Node *> options(bitfield, output_offset, output);

            return new (*allocator) struct QUERY_Filter_n(options.b);
        }

        static void * QUERY_Sort(Token & tk, unsigned reduce_size, unsigned bitfield,
                                 int output_offset, void ** output,
                                 ParseBuffer<char> * allocator) {
            OptionalNodes<int, QUERY_SortList_n *> options(bitfield, output_offset,
                                                           output);

            return new (*allocator) struct QUERY_Sort_n(options.b);
        }

        static void * QUERY_ContainerIdentifierList(Token & tk, unsigned reduce_size,
                                                    unsigned bitfield,
                                                    int output_offset, void ** output,
                                                    ParseBuffer<char> * allocator) {
            QUERY_ContainerIdentifierList_n * ctr = NULL;

            if (reduce_size == 1) {
                ctr = new (*allocator) QUERY_ContainerIdentifierList_n(*allocator);
                ctr->push_back((QUERY_ContainerIdentifier_n *) output[output_offset]);
            } else {
                ctr = (QUERY_ContainerIdentifierList_n *) output[output_offset];
                ctr->push_back((QUERY_ContainerIdentifier_n *) output[output_offset + 1]);
            }

            return ctr;
        }
        static void * QUERY_ContainerIdentifier(Token & tk, unsigned reduce_size,
                                                unsigned bitfield, int output_offset,
                                                void ** output,
                                                ParseBuffer<char> * allocator) {
            return new (output[output_offset]) struct QUERY_ContainerIdentifier_n(
                *(struct QUERY_Identifier_n *) output[output_offset]);
        }

        static void * QUERY_And(Token & tk, unsigned reduce_size, unsigned bitfield,
                                int output_offset, void ** output,
                                ParseBuffer<char> * allocator) {
            return new (*allocator) QUERY_And_n((Node *) output[output_offset],
                                                (Node *) output[output_offset + 2]);
        }
        static void * QUERY_Or(Token & tk, unsigned reduce_size, unsigned bitfield,
                               int output_offset, void ** output,
                               ParseBuffer<char> * allocator) {
            return new (*allocator) QUERY_Or_n((Node *) output[output_offset],
                                               (Node *) output[output_offset + 2]);
        }

        static void * QUERY_Not(Token & tk, unsigned reduce_size, unsigned bitfield,
                                int output_offset, void ** output,
                                ParseBuffer<char> * allocator) {
            return new (*allocator) QUERY_Not_n((Node *) output[output_offset]);
        }

        static void * QUERY_Wrapped(Token & tk, unsigned reduce_size, unsigned bitfield,
                                    int output_offset, void ** output,
                                    ParseBuffer<char> * allocator) {
            return output[output_offset + 1];
        }

        static void * QUERY_Created(Token & tk, unsigned reduce_size, unsigned bitfield,
                                    int output_offset, void ** output,
                                    ParseBuffer<char> * allocator) {
            OptionalNodes<int, QUERY_Comparison_n *, bool> options(
                bitfield, output_offset, output);

            return new (*allocator) struct QUERY_Created_n(options.b, options.c);
        }

        static void * QUERY_Modified(Token & tk, unsigned reduce_size,
                                     unsigned bitfield, int output_offset,
                                     void ** output, ParseBuffer<char> * allocator) {
            OptionalNodes<int, QUERY_Comparison_n *, bool> options(
                bitfield, output_offset, output);

            return new (*allocator) struct QUERY_Modified_n(options.b, options.c);
        }

        static void * QUERY_Size(Token & tk, unsigned reduce_size, unsigned bitfield,
                                 int output_offset, void ** output,
                                 ParseBuffer<char> * allocator) {
            OptionalNodes<int, QUERY_Comparison_n *, bool> options(
                bitfield, output_offset, output);

            return new (*allocator) struct QUERY_Size_n(options.b, options.c);
        }

        static void * QUERY_Tag(Token & tk, unsigned reduce_size, unsigned bitfield,
                                int output_offset, void ** output,
                                ParseBuffer<char> * allocator) {
            OptionalNodes<int, struct QUERY_Identifier_n *, QUERY_Comparison_n *, bool>
                options(bitfield, output_offset, output);

            return new (*allocator) struct QUERY_Tag_n(options.b, options.c, options.d);
        }

        static void * QUERY_ComparisonEquals(Token & tk, unsigned reduce_size,
                                             unsigned bitfield, int output_offset,
                                             void ** output,
                                             ParseBuffer<char> * allocator) {
            return new (*allocator)
                QUERY_Comparison_n(QUERY_Comparison_n::Value, nullptr,
                                   (((double *) output)[output_offset + 1]));
        }

        static void * QUERY_ComparisonEqualsIdentifier(Token & tk, unsigned reduce_size,
                                             unsigned bitfield, int output_offset,
                                             void ** output,
                                             ParseBuffer<char> * allocator) {
            return new (*allocator)
                QUERY_Comparison_n(QUERY_Comparison_n::ID,  (QUERY_Identifier_n *) (output[output_offset + 1]));
        }

        static void * QUERY_ComparisonMore(Token & tk, unsigned reduce_size,
                                           unsigned bitfield, int output_offset,
                                           void ** output,
                                           ParseBuffer<char> * allocator) {
            return new (*allocator)
                QUERY_Comparison_n(QUERY_Comparison_n::MoreThan, nullptr,
                                   (((double *) output)[output_offset + 1]));
        }

        static void * QUERY_ComparisonLess(Token & tk, unsigned reduce_size,
                                           unsigned bitfield, int output_offset,
                                           void ** output,
                                           ParseBuffer<char> * allocator) {
            return new (*allocator)
                QUERY_Comparison_n(QUERY_Comparison_n::LessThan, nullptr,
                                   (((double *) output)[output_offset + 1]));
        }

        static void * QUERY_Range(Token & tk, unsigned reduce_size, unsigned bitfield,
                                  int output_offset, void ** output,
                                  ParseBuffer<char> * allocator) {
            OptionalNodes<int, double, double> options(bitfield, output_offset, output);
            return new (*allocator) QUERY_Comparison_n(QUERY_Comparison_n::Range,
                                                       nullptr, options.b, options.c);
        }

        static void * QUERY_Date(Token & tk, unsigned reduce_size, unsigned bitfield,
                                 int output_offset, void ** output,
                                 ParseBuffer<char> * allocator) {
            OptionalNodes<int, double, double> options(bitfield, output_offset, output);
            return new (*allocator) QUERY_Comparison_n(QUERY_Comparison_n::Range,
                                                       nullptr, options.b, options.c);
        }

        static void * QUERY_OrderDescending(Token & tk, unsigned reduce_size,
                                            unsigned bitfield, int output_offset,
                                            void ** output,
                                            ParseBuffer<char> * allocator) {
            return (void *) 0;
        }

        static void * QUERY_OrderAscending(Token & tk, unsigned reduce_size,
                                           unsigned bitfield, int output_offset,
                                           void ** output,
                                           ParseBuffer<char> * allocator) {
            return (void *) 1;
        }

        static void * QUERY_Identifier(Token & tk, unsigned reduce_size,
                                       unsigned bitfield, int output_offset,
                                       void ** output, ParseBuffer<char> * allocator) {
            const wstring & string = tk.string;

            if (reduce_size == 1) {
                unsigned start = (unsigned long long) output[output_offset],
                         end   = tk.offset;

                while (string[end - 1] == L' ')
                    end--;

                while (string[start] == L' ')
                    start++;

                if(start > end)
                  start = end;

                parse_string * str = new (*allocator)
                    parse_string(string.substr(start, end - start), *allocator);

                QUERY_IdentifierList_n * ctr =
                    new (*allocator) QUERY_IdentifierList_n(*allocator);

                ctr->push_back(str);

                return new (*allocator) struct QUERY_Identifier_n(ctr);

            } else {
                unsigned start = (unsigned long long) output[output_offset + 1],
                         end   = tk.offset;

                while (string[end - 1] == L' ')
                    end--;

                parse_string * str = new (*allocator)
                    parse_string(string.substr(start, end - start), *allocator);

                struct QUERY_Identifier_n * id =
                    (struct QUERY_Identifier_n *) output[output_offset];

                id->list.push_back(str);

                return id;
            }
        }

        static void * QUERY_Sentence(Token & tk, unsigned reduce_size,
                                     unsigned bitfield, int output_offset,
                                     void ** output, ParseBuffer<char> * allocator) {
            unsigned start = (unsigned long long) output[output_offset], end = tk.offset;
            parse_string * str = new (*allocator)
                parse_string(tk.string.substr(start, end - start), *allocator);

            return new (*allocator) struct QUERY_Sentence_n(str);
        }

        static void * QUERY_EscapedValue(Token & tk, unsigned reduce_size,
                                         unsigned bitfield, int output_offset,
                                         void ** output, ParseBuffer<char> * allocator) {
            return nullptr; // new(*allocator) int[2555];
        }

        static void * StringData(Token & tk, unsigned reduce_size, unsigned bitfield,
                                 int output_offset, void ** output,
                                 ParseBuffer<char> * allocator) {
            return output[output_offset];
        }

        static void * Number(Token & tk, unsigned reduce_size, unsigned bitfield,
                             int output_offset, void ** output,
                             ParseBuffer<char> * allocator) {
            unsigned start = (unsigned long long) output[output_offset], end = tk.offset;

            ((double *) output)[output_offset] =
                stod(tk.string.substr(start, end - start));

            return output[output_offset];
        }

        static void * LAST(Token & tk, unsigned reduce_size, unsigned bitfield,
                           int output_offset, void ** output,
                           ParseBuffer<char> * allocator) {
            return output[output_offset + reduce_size - 1];
        }
    };
}; // namespace RUMINATE_COMMAND_NODES
