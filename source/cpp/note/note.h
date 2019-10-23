#pragma once

#include <cstring>
#include <iostream>
#include <sstream>
#include <vector>

#include "../compiler/compiler.h"
#include "../string/crdt.h"
#include "../string/search.h"
#include "../tags/tags.h"
#include "../uid/uid.h"
#include "../utils/stream.h"
#include "./id.h"

namespace RUMINATE
{

    namespace NOTE
    {
        using namespace STRING;
        using namespace TAG;
        using std::vector;
        using std::wstring;

        typedef CharOp<OP_ID, OPChar<ASCII>> ASCII_OP;
        typedef OPString<ASCII_OP, OPBuffer<ASCII_OP>> JSCRDTString;

        class Note
        {

          private:
            virtual void serialize(std::ostream &) const = 0;
            virtual void deserialize(std::istream &)     = 0;

          public:
            unsigned type = 0;

            TagContainer tags;

            UID uid;

            ID id;

            time_t modified_time;

            bool SERIALIZED = false;

            Note(UID _uid = UID()) : uid(_uid), id(L"") {}

            Note(unsigned char * data) {}

            virtual ~Note() {}

            virtual const wstring toJSONString() const = 0;

            virtual std::ostream & toJSONString(std::ostream &) const = 0;

            virtual bool fuzzySearchMatchFirst(const RUMINATE_COMMAND_NODES::parse_string &) = 0;

            virtual void updateBody(const RUMINATE_COMMAND_NODES::parse_string &) = 0;

            void updateTags(const RUMINATE_COMMAND_NODES::NOTE_TagList_n & tag_node) { tags.update(tag_node); }

            /**** Streaming Functions ****/
            friend std::ostream & operator<<(std::ostream & stream, const Note & note)
            {
                note.serialize(stream);
                return stream;
            }

            friend Note & operator<<(Note & note, std::istream & stream)
            {
                note.deserialize(stream);
                return note;
            }

            /**** End Streaming Functions ****/
            virtual const wstring id_name() const { return id.name(); }
        };
    } // namespace NOTE
} // namespace RUMINATE
