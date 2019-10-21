#pragma once

#include "../string/utf.h"
#include "./note.h"
#include <codecvt>
#include <locale>
#include <sstream>
#include <string>

namespace RUMINATE {
    namespace NOTE {
        using std::string;

        class BasicNote : public Note {
          private:
          public:
            wstring body;

          private:
            virtual void serialize(std::ostream & stream) const {
                stream << uid;
                stream.write((char *) &type, sizeof(type));
                stream.write((char *) &modified_time, sizeof(modified_time));
                //writeString(stream, id);
                stream << id << ";";
                stream << tags;
                stream << body;
            }

            virtual void deserialize(std::istream & stream) {
                uid << stream;
                stream.read((char *) &type, sizeof(type));
                stream.read((char *) &modified_time, sizeof(modified_time));
                readString(stream, id, (wchar_t) ';');
                tags << stream;
                body << stream;
            }

          public:
            BasicNote(UID uid = UID()) : Note(uid) {}
            virtual ~BasicNote() {}

            virtual bool fuzzySearchMatchFirst(const RUMINATE_COMMAND_NODES::parse_string & string) {
                return STRING::fuzzySearchMatchFirst<wstring, wchar_t, RUMINATE_COMMAND_NODES::parse_string>(body, string);
            }

            virtual const wstring toJSONString() {
                wstring string = L"";

                string += L"{ type:\"BASIC_NOTE\",";

                string += L"\"uid\":";

                string += uid.toJSONString();

                string += L",\"id\":\"";

                string += id;

                string += L",\"body\":\"";

                string += body;

                string += L"\"}";

                return string;
            }

            virtual void updateBody(const RUMINATE_COMMAND_NODES::parse_string & body_string) {
                body.assign(body_string);
            }
        };

    } // namespace NOTE
} // namespace RUMINATE