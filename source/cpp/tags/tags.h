#pragma once

#include <iostream>
#include <tuple>
#include <vector>
#include <cstring>
#include "./tag_value.h"
#include "../utils/stream.h"

namespace RUMINATE
{


	namespace TAG
	{
		using std::wstring;
		using std::vector;

		static unsigned sentinal_start 	= 0xFFFF0001;
		static unsigned sentinal_end 	= 0x1000FFFF;

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

			/**** Streaming Functions ****/

			friend std::ostream& operator << (std::ostream& stream, const TagContainer& ctr) {

				stream.write((char *)&ctr.count, sizeof(ctr.count));

				for(auto tag : ctr.tags) {
					stream.write((char *)&sentinal_start, sizeof(sentinal_start));
					writeString(stream, tag.id);
					stream << tag.val;
				}

				stream.write((char *)&sentinal_end, sizeof(sentinal_end));

				return stream;
			}

			friend TagContainer& operator << (TagContainer& ctr, std::istream& stream) {
				unsigned char total = 0;
				stream.read((char *)&total, sizeof(total));

				unsigned sentinal = 0;
				stream.read((char *)&sentinal, sizeof(sentinal));

				if(sentinal == sentinal_start && total > 0) {
					while(sentinal != sentinal_end && stream.good()) {
						Tag tag;
						readString(stream, tag.id);
						tag.val << stream;
						ctr.tags.push_back(tag);
						stream.read((char*)&sentinal, 4);

						std::wcout << tag.id << std::endl;

						ctr.count++;
					}
				}

				if(total != ctr.count)
					std::cout << "Count does not match total!" << std::endl;

				return ctr;
			}

			void fromBracketedStream(std::istream&) ;

			/**** End Streaming Functions ****/

			Tag * operator [](const unsigned index) {
				return &tags[index];
			}

			unsigned size () const {
				return tags.size();
			}
		};
		Tag * getMatchingTag(TagContainer&, const wstring&);
	}
}
