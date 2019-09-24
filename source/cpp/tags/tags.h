#pragma once

#include <tuple>
#include <vector>
#include <cstring>

namespace RUMINATE
{


	namespace TAG
	{
		using std::wstring;
		using std::vector;

		enum class TYPES : unsigned char
		{
		    NONE,
		    STRING,
		    DOUBLE,
		    INT
		};

		class Tag
		{
		public:

			wstring id;

			union {
				wstring * 	str_val;
				long long 	int_val;
				double 		dbl_val;
			};

			TYPES type = TYPES::NONE;

			wstring getText();
			double getDouble();
			long long getLongInt();
		};

		class TagContainer
		{
		public:


			vector<Tag> tags;
			unsigned char count = 0;

			void addTag(wstring);
			void addTag(wstring, double);
			void addTag(wstring, int);
			void addTag(wstring, wstring str);
			void removeTag(wstring);

			Tag * operator [](unsigned index) {
				return &tags[index];
			}

			unsigned size () {
				return tags.size();
			}

		};
		Tag * getMatchingTag(TagContainer&, const wstring&);
	}
}
