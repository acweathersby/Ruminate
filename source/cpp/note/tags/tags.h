#pragma once

#include "compiler/compiler.h"
#include "note/tags/tag_value.h"
#include "string/utf.h"
#include "utils/stream.h"
#include <cstring>
#include <iostream>
#include <tuple>
#include <vector>

namespace RUMINATE
{
    namespace TAG
    {
        using std::vector;
        using std::wstring;

        static unsigned sentinal_start = 0xFFFF0001;
        static unsigned sentinal_end   = 0x1000FFFF;

        struct Tag {
            wstring id;
            TagValue val;
        };

        class TagContainer
        {
          public:
            vector<Tag> tags;

            unsigned char count = 0;

            void addTag(wstring);
            void addTag(wstring, double);
            void addTag(wstring, long long);
            void addTag(wstring, int);
            void addTag(wstring, wstring);

            void removeTag(wstring);

            const wstring toJSONString() const;

            std::ostream & toJSONString(std::ostream & stream) const;

            void fromBracketedStream(std::istream &);

            Tag * operator[](const unsigned index) { return &tags[index]; }

            inline unsigned size() const { return tags.size(); }

            void update(const RUMINATE_COMMAND_NODES::NOTE_TagList_n & tag_list);


            /**** Streaming Functions ****/

            friend std::ostream & operator<<(std::ostream & stream, const TagContainer & ctr)
            {

                // stream.write((char *) &ctr.count, sizeof(ctr.count));
                stream << "{";

                for (auto tag : ctr.tags) {
                    // stream.write((char *) &sentinal_start, sizeof(sentinal_start));
                    stream << tag.id;
                    stream << ":";
                    stream << tag.val;
                }

                stream << "}";

                // stream.write((char *) &sentinal_end, sizeof(sentinal_end));

                return stream;
            }

            friend TagContainer & operator<<(TagContainer & ctr, std::istream & stream)
            {
                // unsigned char total = 0;
                // stream.read((char *) &total, sizeof(total));

                //                //unsigned sentinal = 0;
                //                //stream.read((char *) &sentinal, sizeof(sentinal));
                char c;

                if (stream.peek() == '{') {
                    stream.get(c);

                    while (stream.good()) {

                        if (stream.peek() == '}') {
                            stream.get(c);
                            break;
                        }

                        Tag tag;

                        readString(stream, tag.id, (wchar_t) ':');

                        tag.val << stream;

                        ctr.tags.push_back(tag);
                    }
                }

                return ctr;
            }

            /**** End Streaming Functions ****/
        };


        template <class U> Tag * getMatchingTag(TagContainer & tags, const U & id)
        {

            for (int i = 0; i < tags.size(); i++) {
                Tag * tag = tags[i];

                if (id.compare(tag->id) == 0) {

                    return tag;
                }
            }
            return NULL;
        };
    } // namespace TAG
} // namespace RUMINATE
