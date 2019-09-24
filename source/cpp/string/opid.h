#include <iostream>
#include <cstring>
#include <sstream>

namespace RUMINATE
{
	namespace STRING
	{


		typedef unsigned short opvalue;
		typedef unsigned char idsite;
		typedef unsigned int idclock;
		typedef unsigned int idindex;

		struct OP_ID {
			idclock clock = 0;
			idsite site = 0;

			bool compareVectorClock(const OP_ID& other) const {
				return other.site == site && other.clock == clock;
			}

			int compareClock(const OP_ID& other) const {
				return other.site < site ?  -1 : other.site > site ? 1 : other.clock < clock ? -1 : other.clock > clock ? 1 :  0;
			}

			friend std::ostream& operator << (std::ostream& os, const OP_ID& i) {
				return os << "{\"site\":" << (unsigned short)i.site << ",\"clock\":" << i.clock << "}";
			}

			friend bool operator == (const OP_ID& a, const OP_ID& b) {
				return a.clock == b.clock && a.site == b.site;
			}

			friend bool operator != (const OP_ID& a, const OP_ID& b) {
				return !( b == a);
			}

			bool follows(const OP_ID& id) const {
				return id.site == site && id.clock == clock - 1;
			}
			unsigned getSite() const {
				return site;
			}
			unsigned getClock() const {
				return clock;
			}
			void setSite(idsite s) {site = s;}
			void setClock(idclock t) {clock = t;}
		};
	}
}
