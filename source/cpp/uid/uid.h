#pragma once
#include <time.h>
#include <cstdlib>
#include <time.h>
#include <iostream>

namespace RUMINATE
{
	/**
		For Ruminate objects needing a unique identifier.
	**/

	struct UID {

		time_t created_time;

		unsigned char magic = 0b10011001;

		unsigned random = 0;

		UID() : random(rand()) {
			time(&created_time);
		}

		friend bool operator == (const UID& a, const UID& b) {
			return a.created_time == b.created_time && b.random == a.random;
		}

		friend std::ostream& operator << (std::ostream& os, UID& uid) {
			return os << uid.created_time << "-" << (unsigned)uid.magic << "-" << uid.random;
		}
	};

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
