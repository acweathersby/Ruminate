#pragma once

#include "note/note.h"
#include "string/utf.h"

#include <boost/algorithm/string/replace.hpp>
#include <codecvt>
#include <locale>
#include <sstream>
#include <string>

namespace RUMINATE
{
    namespace NOTE
    {
        using std::string;

        class BasicNote : public Note
        {
          private:
          public:
            wstring body;

          private:
            virtual void serialize(std::ostream & stream) const;

            virtual void deserialize(std::istream & stream);

          public:
            BasicNote(UID uid = UID()) : Note(uid) {}

            virtual ~BasicNote() {}

            virtual bool fuzzySearchMatchFirst(const RUMINATE_COMMAND_NODES::parse_string & string);

            virtual void updateBody(const RUMINATE_COMMAND_NODES::parse_string & body_string);

            virtual const wstring toJSONString() const;

            virtual std::ostream & toJSONString(std::ostream &) const;
        };
    } // namespace NOTE
} // namespace RUMINATE