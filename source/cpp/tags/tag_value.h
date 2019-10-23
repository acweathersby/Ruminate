#pragma once

#include "../utils/stream.h"
#include <codecvt>
#include <cstring>
#include <iostream>
#include <math.h>

#define NaNMask 0x7FF
#define PTRMask 0xFFF0000000000000

namespace RUMINATE
{

    namespace TAG
    {
        using std::istream;
        using std::ostream;
        using std::wstring;

        enum class TYPES : unsigned char { DOUBLE = 0, STRING = 1, INT };

        class TagValue
        {

            union {
                void * ptr_val;
                long long int_val;
                double dbl_val;
            };

            void reset() { int_val = 0; }

            TYPES getType() const
            {
                if (!isnan(dbl_val)) return TYPES::DOUBLE;

                if ((int_val & PTRMask) == PTRMask) return TYPES::STRING;

                return TYPES::INT;
            }

            void * getPTR() const { return (void *) (int_val & ~PTRMask); }

          public:
            /**** Operator Overloads ****/

            // Double
            void setVal(const double & dbl) { dbl_val = dbl; }

            TagValue & operator=(double & dbl)
            {
                setVal(dbl);
                return *this;
            }

            operator double() const { return dbl_val; }

            friend bool operator==(double d, TagValue & v)
            {
                if (v.isDouble()) {
                    return d == v.dbl_val;
                }
                return false;
            }
            friend bool operator==(TagValue & v, double d) { return d == v; }
            friend bool operator>(double d, TagValue & v)
            {
                if (v.isDouble()) {
                    return d > v.dbl_val;
                }
                return false;
            }
            friend bool operator>(TagValue & v, double d)
            {
                if (v.isDouble()) {
                    return v.dbl_val > d;
                }
                return false;
            }
            friend bool operator<(double d, TagValue & v)
            {
                if (v.isDouble()) {
                    return d < v.dbl_val;
                }
                return false;
            }
            friend bool operator<(TagValue & v, double d)
            {
                if (v.isDouble()) {
                    return v.dbl_val < d;
                }
                return false;
            }

            friend bool operator>=(double d, TagValue & v) { return d == v || d > v; }
            friend bool operator>=(TagValue & v, double d) { return v == d || v > d; }
            friend bool operator<=(double d, TagValue & v) { return d == v || d < v; }
            friend bool operator<=(TagValue & v, double d) { return v == d || v < d; }


            // String
            void setVal(wstring * str)
            {
                ptr_val = str;
                int_val = int_val | PTRMask;
            }

            TagValue & operator=(wstring * str)
            {
                setVal(str);
                return *this;
            }

            operator wstring *() const
            {
                wstring * tptr = nullptr;

                if (getType() == TYPES::STRING) tptr = (wstring *) getPTR();

                return tptr;
            }

            // Integer
            void setVal(long long & intv)
            {
                int_val = intv;
                int_val = int_val | (PTRMask ^ (1 << 63));
            }

            TagValue & operator=(long long & intv)
            {
                setVal(intv);
                return *this;
            }

            operator long long() const
            {
                long long intv = 0;
                if (getType() == TYPES::INT) {
                    intv = (int_val & ~PTRMask);
                    intv = intv >> 51 == 1 ? intv | ~PTRMask : intv;
                }
                return intv;
            }

            /**** End Operator Overloads ****/

            bool isDouble() const { return getType() == TYPES::DOUBLE; }

            bool isString() const { return getType() == TYPES::STRING; }

            bool isText() const { return getType() == TYPES::DOUBLE; }


            /**** String Operations *****/

            operator wstring() const
            {
                wstring str;
                // /stream.write((char *) &val.int_val, sizeof(val));
                if (isString()) {
                    str += *(wstring *) getPTR();
                } else {
                    str += ((double) *this);
                }

                return str;
            }

            /**** Streaming Functions ****/

            std::ostream & toJSONString(std::ostream & stream) const
            {
                if (isString()) {
                    std::wstring_convert<std::codecvt_utf8<wchar_t>> converter;
                    stream << "\"" << converter.to_bytes(*(wstring *) getPTR());
                    stream << "\"";
                } else
                    stream << ((double) *this);

                return stream;
            }

            friend std::ostream & operator<<(std::ostream & stream, const TagValue & val)
            {
                // /stream.write((char *) &val.int_val, sizeof(val));
                if (val.isString()) {
                    stream << *(wstring *) val.getPTR();
                } else {
                    stream << std::to_string((double) val);
                }

                stream << ";";

                return stream;
            }

            friend TagValue & operator<<(TagValue & val, std::istream & stream)
            {
                // stream.read((char *) &val, sizeof(val));

                // if (val.isString()) {
                wstring * string = new wstring();

                readString(stream, *string, (wchar_t) ';');

                try {
                    val.setVal((double) stod(*string));
                    delete string;
                } catch (...) {
                    val.setVal(string);
                }

                //}
                return val;
            }

            /**** Eg Functions ****/
        };
    } // namespace TAG
} // namespace RUMINATE
