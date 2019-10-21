#pragma once

#include "./note.h"


namespace RUMINATE {
    namespace NOTE {

        class CRDTNote : public Note {
          public:
            static unsigned CRDT_SITE;
            JSCRDTString body;

          private:
            virtual void serialize(std::ostream & stream) const {
                stream << uid;
                stream.write((char *) &type, sizeof(type));
                writeString(stream, id);
                stream.write((char *) &modified_time, sizeof(modified_time));
                stream << tags;
                stream << body;
            }

            virtual void deserialize(std::istream & stream) {
                uid << stream;
                stream.read((char *) &type, sizeof(type));
                readString(stream, id);
                stream.read((char *) &modified_time, sizeof(modified_time));
                tags << stream;
                body << stream;
            }

          public:
            CRDTNote(UID uid = UID()) : Note(uid), body(CRDT_SITE) {}
            virtual ~CRDTNote() {}

            virtual bool fuzzySearchMatchFirst(const RUMINATE_COMMAND_NODES::parse_string & string) {
                return STRING::fuzzySearchMatchFirst<JSCRDTString, wchar_t, RUMINATE_COMMAND_NODES::parse_string>(body, string);
            }

            virtual const wstring toJSONString() {
                wstring string = L"";

                string += L"{";

                string += L"\"uid\":";

                string += uid.toJSONString();

                string += L",\"id\":\"";

                string += id;

                string += L",\"body\":\"";

                string += body.getValue();

                string += L"\"}";

                return string;
            }

            virtual void updateBody(const RUMINATE_COMMAND_NODES::parse_string & body_string) {
                ;
            }
        };

    } // namespace NOTE
} // namespace RUMINATE