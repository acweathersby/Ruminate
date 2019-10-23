#pragma once

#include "./note.h"


namespace RUMINATE
{
    namespace NOTE
    {

        class CRDTNote : public Note
        {
          public:
            static unsigned CRDT_SITE;
            JSCRDTString body;

          private:
            virtual void serialize(std::ostream & stream) const
            {
                stream << uid;
                stream.write((char *) &type, sizeof(type));
                stream << id;
                stream.write((char *) &modified_time, sizeof(modified_time));
                stream << tags;
                stream << body;
            }

            virtual void deserialize(std::istream & stream)
            {
                uid << stream;
                stream.read((char *) &type, sizeof(type));
                id << stream;
                stream.read((char *) &modified_time, sizeof(modified_time));
                tags << stream;
                body << stream;
            }

          public:
            CRDTNote(UID uid = UID()) : Note(uid), body(CRDT_SITE) {}
            virtual ~CRDTNote() {}

            virtual bool fuzzySearchMatchFirst(const RUMINATE_COMMAND_NODES::parse_string & string)
            {
                return STRING::fuzzySearchMatchFirst<JSCRDTString, wchar_t, RUMINATE_COMMAND_NODES::parse_string>(
                    body, string);
            }

            virtual const wstring toJSONString() const
            {
                wstring string = L"";

                string += L"{";

                string += L"\"uid\":";

                string += uid.toJSONString();

                string += L",\"id\":\"";

                string += string + id;

                string += L",\"tags\":";

                string += tags.toJSONString();

                string += L"\",\"body\":\"";

                string += body.getValue();

                string += L"\"}";

                return string;
            }

            virtual std::ostream & toJSONString(std::ostream & s) const { return s; };


            virtual void updateBody(const RUMINATE_COMMAND_NODES::parse_string & body_string) { ; }
        };

    } // namespace NOTE
} // namespace RUMINATE