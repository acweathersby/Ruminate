#pragma once
#include <time.h>
#include <cstdlib>
#include <time.h>
#include <iostream>
#include <string>
#include <cstring>
#include <random>

namespace RUMINATE
{

	static unsigned root = 0;
	static char RUMINATE_MAGIC_NUMBER[5] = "RUMI";
	/**
	For Ruminate objects needing a unique identifier.
	**/

	using std::wstring;

	static std::random_device rd;
	static std::mt19937 mt(rd());
	static std::uniform_real_distribution<float> dist(0, 0xFFFFFFF0);

	struct UID {

		unsigned magic = *(unsigned *)(&RUMINATE_MAGIC_NUMBER);

		unsigned long long created_time;

		unsigned random = 0;

		UID() {
			time_t t;
			time(&t);
			srand(time(0));
			created_time = t;
			random = dist(mt);
		}

		UID(unsigned n) {
			magic = 0;
			created_time = 0;
			random = 0;
		}

		friend bool operator == (const UID& a, const UID& b) {
			return a.created_time == b.created_time && b.random == a.random;
		}

		friend std::ostream& operator << (std::ostream& stream, const UID& uid) {
			stream.write((char *)(&(uid)), sizeof(uid));
			return stream;
		}

		friend UID& operator << (UID& uid, std::istream& stream) {
			stream.read((char *)(&(uid)), sizeof(uid));
			return uid;
		}

		wstring toJSONString() const {
			wstring string(L"{\"type\":\"RUMI-UID\", \"created_time\":");
			string += std::to_wstring(created_time);
			string += wstring(L", \"random\":");
			string += std::to_wstring(random);
			string += wstring(L"}");
			return string;
		}
	};

	static UID NullUID(0);

}

namespace std
{
	template <>
	struct hash<RUMINATE::UID> {
		size_t operator()(const RUMINATE::UID& uid) const {
			return (size_t)(uid.created_time ^ uid.random << 2);
		}
	};
}
