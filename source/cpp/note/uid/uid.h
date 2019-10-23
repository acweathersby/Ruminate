#pragma once

#include "compiler/uid_nodes.h"
#include "utils/stream.h"

#include <codecvt>
#include <cstdlib>
#include <iostream>
#include <random>
#include <string>
#include <time.h>


namespace RUMINATE
{

    static unsigned root                 = 0;
    static char RUMINATE_MAGIC_NUMBER[5] = "RUMI";

    using std::wstring;

    static std::random_device rd;
    static std::mt19937 mt(rd());
    static std::uniform_real_distribution<float> dist(0, 0xFFFFFFF0);

    /**
     * For Ruminate objects needing a unique identifier. Primarily used by note objects.
     *
     *      Text form of UID
     *          RUMI-###[EPOCH]###-#[RAND]#

     *      BINARY Packed form of UID
     *      |0   4   8   12  16|
            ||...|...|...|...|.|
     *       [m ][e     ][r ]
     *        |   |       |
     *        Magic Number
     *            |       |
     *            Epoch Time Stamp In Microseconds - Offset from install date.
     *                    |
     *                    Random Hash Value
     *
     */

    struct UID {

        unsigned magic = *(unsigned *) (&RUMINATE_MAGIC_NUMBER);

        unsigned long long created_time;

        unsigned random = 0;

        UID();

        UID(unsigned);

        UID(const RUMINATE_COMMAND_NODES::UID_UID_n &);

        wstring toJSONString() const;

        std::ostream & toJSONString(std::ostream &) const;

        friend bool operator==(const UID & a, const UID & b)
        {
            return a.created_time == b.created_time && b.random == a.random;
        }

        friend std::ostream & operator<<(std::ostream & stream, const UID & uid)
        {
            if (stream.rdbuf() == std::cout.rdbuf()) {
                stream << std::hex << "RUMI-" << uid.created_time << "-" << uid.random;
            } else {
                stream << std::hex << "RUMI-" << uid.created_time << "-" << uid.random << "R";
            }
            return stream;
        }

        friend UID & operator<<(UID & uid, std::istream & stream)
        {
            // stream.read((char *)(&(uid)), sizeof(uid));
            char buffer[5];

            stream.read(buffer, 5);

            uid.magic = *(unsigned *) buffer;

            wstring str;

            try {
                readString(stream, str, L'-');
                uid.created_time = std::stoull(str, 0, 16);

                readString(stream, str, L'R');
                uid.random = std::stoul(str, 0, 16);
            } catch (...) {
                uid.created_time = 0;
                uid.random       = 0;
            }

            return uid;
        }
    };

    static UID NullUID(0);

} // namespace RUMINATE

namespace std
{
    template <> struct hash<RUMINATE::UID> {
        size_t operator()(const RUMINATE::UID & uid) const { return (size_t)(uid.created_time ^ uid.random << 2); }
    };
} // namespace std
