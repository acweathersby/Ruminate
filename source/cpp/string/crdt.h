#pragma once

#include <cstring>
#include <fstream>
#include <iostream>
#include <sstream>

namespace RUMINATE
{
    namespace STRING
    {


        typedef unsigned short opvalue;
        typedef unsigned char idsite;
        typedef unsigned int idclock;
        typedef unsigned int idindex;

        static wchar_t uber_buffer[100000];

        struct OP_ID {

          private:

            static const unsigned SITE_MASK  = 0xF8000000;

            static const unsigned CLOCK_MASK = ~SITE_MASK;

            unsigned data                    = 0;

          public:
            bool compareVectorClock(const OP_ID & other) const
            {
                return other.site() == site() && other.clock() == clock();
            }

            int compareClock(const OP_ID & other) const
            {
                return other.site() < site()
                           ? -1
                           : other.site() > site() ? 1 : other.clock() < clock() ? -1 : other.clock() > clock() ? 1 : 0;
            }

            friend std::ostream & operator<<(std::ostream & os, const OP_ID & i)
            {
                return os << "{\"site\":" << (unsigned short) i.site() << ",\"clock\":" << i.clock() << "}";
            }

            friend bool operator==(const OP_ID & a, const OP_ID & b) { return a.data == b.data; }

            friend bool operator!=(const OP_ID & a, const OP_ID & b) { return !(b == a); }

            bool follows(const OP_ID & id) const { return ((data - id.data) == 1) ? true : false; }

            unsigned site() const { return getSite(); }

            unsigned getSite() const { return data >> 27; }

            unsigned clock() const { return getClock(); }

            unsigned getClock() const { return data & CLOCK_MASK; }

            void setSite(idsite s) { data = ((data & ~SITE_MASK) | (s << 27)); }

            void setClock(idclock t) { data = ((data & ~CLOCK_MASK) | (t & CLOCK_MASK)); }
        };


       
        struct Encoding {

            unsigned  getCodePoint() const {};

            void setCodePoint(const unsigned c) {};

            bool isDeleteOperation() const {};

            unsigned byteSize() const {};

            bool isDelete() const {};
        };

        struct ASCII : public Encoding {

            unsigned char val;

            unsigned getCodePoint() const { return val; }

            void setCodePoint(const unsigned c) { val = (c & 127); }

            bool isDeleteOperation() const {  }

            unsigned byteSize() const { return 1; }

            bool isDelete() const { return 0 == val; }
        };

        struct UTF8 : Encoding {

            unsigned char byte1;
            unsigned char byte2;
            unsigned char byte3;
            unsigned char byte4;

            unsigned getCodePoint() const { };

            void setCodePoint(const unsigned c) {  };

            bool isDeleteOperation() const {  };

            unsigned byteSize() const {  }

            bool isDelete() const {  }
        };


        template <class Encoding> struct OpCharacter {

            typedef OpCharacter<Encoding> OpChar;

            OP_ID id        = OP_ID();
            OP_ID origin    = OP_ID();
            Encoding data   = Encoding();

            OpCharacter() {}

            OpCharacter(unsigned ref) {
                id.setSite(ref >> 4);
                id.setClock(ref & 0xF);
            }

            static OpChar fromBuffer(char * buffer, unsigned offset){ 
                OpCharacter<Encoding> * op = ((void *)(buffer[offset]));
                return &op;
            }   

            void toBuffer(char * buffer, unsigned offset) {
                memcpy(this, buffer[offset], byteSize());
            }

            static const unsigned max_size() { return sizeof(OP_ID) * 2 + sizeof(Encoding); }

            unsigned toUnsigned() const { return (unsigned) ((id.site() & 0xF) | id.clock() << 4); }

            bool isDeleteOperation() const { return data.isDeleteOperation(); }

            unsigned byteSize() const { return data.byteSize() + sizeof(OP_ID) * 2; }

            unsigned getCodePoint(const unsigned cp) const { return data.getCodePoint(); };

            void setCodePoint(const unsigned c) { data.setCodePoint(c); };

            void setIDSite(const unsigned v) { id.setSite(v); }

            void setIDClock(const unsigned v) { id.setClock(v); }

            void setOriginSite(const unsigned v) { origin.setSite(v); }

            void setOriginClock(const unsigned v) { origin.setClock(v); }

            unsigned char getIDSite() const { return id.site(); }

            unsigned getIDClock() const { return id.clock(); }

            unsigned char getOriginSite() const { return origin.site(); }

            unsigned getOriginClock() const { return origin.clock(); }

            bool isOrigin(const OpChar & op) const
            {
                return (op.getIDClock() == getOriginClock() && op.getIDSite() == getOriginSite());
            }

            bool isSame(const OpChar & op) const
            {
                return ((int) op.getIDClock() - (int) getIDClock() + (int) op.getIDSite() - (int) getIDSite()) == 0;
            }

            friend std::ostream & operator<<(std::ostream & os, const OpChar & op)
            {
                if (op.isDeleteOperation())
                    return os << "{\"id\":" << op.id << ",\"origin\":" << op.origin << ",\"value\":\"DEL\"}";
                return os << "{\"id\":" << op.id << ",\"origin\":" << op.origin << ",\"value\":\""
                          << (char) op.getValue() << "\"}";
                return os;
            }

            /***** Compares the ids site and clock value *****/
            friend bool operator==(const OpChar & a, const OpChar & b)
            {
                return a.isSame(b);
            }

            /***** Compares the ids site and clock value *****/
            friend bool operator<(const OpChar & a, const OpChar & b)
            {
                return a.getIDClock() < b.getIDClock() ||
                       (a.getIDClock() == b.getIDClock() && a.getIDSite() < b.getIDSite());
            }

            /***** Compares the ids site and clock value *****/
            friend bool operator>(const OpChar & a, const OpChar & b)
            {
                return a.getIDClock() > b.getIDClock() ||
                       (a.getIDClock() == b.getIDClock() && a.getIDSite() > b.getIDSite());
            }


            //		CharOp<MetaStamp, Operator>& operator= (char& c ){ return  * ( CharOp<MetaStamp, Operator> * ) &c;}
        };

        template <class Encoding> struct OPBuffer {

            typedef OpCharacter<Encoding> OpChar;

            unsigned byte_length = 0;

            unsigned op_marker = 0;

            unsigned size = 0;

            unsigned count = 0; // Number of operations stored

            char * data = NULL;

            bool CLONED = false;

            OpChar last;

            OPBuffer()
            {
                size = 512;
                data = (char *) std::malloc(size);
            }

            OPBuffer(unsigned s) : size(8192) { data = (char *) std::malloc(size); }

            ~OPBuffer()
            {
                if (!CLONED && data != NULL) {
                    free((void *) data);
                    data = NULL;
                }
            }

            OPBuffer(const OPBuffer & buffer) { buffer.copy(*this); }

            void copy(OPBuffer & copy_to_buffer) const
            {

                if (copy_to_buffer.data == data || copy_to_buffer.CLONED) {
                    return; // Do not overwite data!
                }

                copy_to_buffer.byte_length = byte_length;
                copy_to_buffer.op_marker   = op_marker;
                copy_to_buffer.count       = count;

                if (copy_to_buffer.size != size) {
                    if (copy_to_buffer.data != nullptr) free(copy_to_buffer.data);
                    copy_to_buffer.data = (char *) std::malloc(size);
                    copy_to_buffer.size = size;
                }

                std::memcpy(copy_to_buffer.data, data, size);

                return;
            }

            OPBuffer clone() const
            {

                OPBuffer copy;

                copy.byte_length = byte_length;
                copy.op_marker   = op_marker;
                copy.size        = size;

                copy.count = count;

                copy.last = last;

                copy.data = data;

                copy.CLONED = true;
                return copy;
            }

            bool maxSizeReached(unsigned allocation_amount) const { return byte_length + allocation_amount >= size; }

            inline bool atEnd() const
            {
                // std::cout << "At end? "<< ((op_marker >= byte_length) ? "TRUE" : "FALSE") <<" count: " << count << "
                // current size: " << size << " marker:" << op_marker << "byte_length: " << byte_length << std::endl;
                return op_marker >= byte_length;
            }

            inline bool atBeginning() const { return op_marker <= 0; }

            OpChar current() const { return *((OpChar *) &data[op_marker]); }

            OpChar next()
            {

                OpChar curr = current();

                if (atEnd()) {
                    return last;
                }

                op_marker += curr.byteSize();

                last = curr;

                return current();
            }

            /* Resets the op_marker to 0, pointer to the first Operator in the buffer. */

            OPBuffer & reset()
            {
                op_marker = 0;
                return *this;
            }


            /* Doubles the size of the buffer or returns false if not enough memory can be allocated. */
            bool expand(unsigned s)
            {

                if (s == size && data != NULL) return true;

                char * n_buffer = (char *) std::malloc(s); // new char[size << 1];

                if (n_buffer == NULL) return false;

                size = s;

                std::memcpy(n_buffer, data, byte_length);

                if (data != nullptr) free(data);

                data = n_buffer;

                return true;
            }

            /*
                Inserts given Operator into buffer at the current op_marker.
                Operators following Operator are shifted up the buffer by current().byteSize()
            */
            bool insert(OpChar & op)
            {

                if (maxSizeReached(op.byteSize()) && !expand(size << 1))
                    return false; // Unable to allocate enough space to expand buffer.

                char * a = &data[op_marker];

                unsigned op_size = op.byteSize();
                //*
                if (!atEnd()) {
                    std::memmove(&data[op_marker + op_size], a, byte_length - op_marker);
                }
                //*/

                count++;

                std::memcpy(a, &op, op_size);

                byte_length += op_size;

                return true;
            }

            /*
                Removes Operator in buffer at the current op_marker.
                Operators following Operator are shifted down the buffer by current().byteSize()
            */
            bool remove()
            {

                unsigned op_size = current().byteSize();

                char * a = &data[op_marker];
                char * b = &data[op_marker + op_size];

                std::memmove(a, b, byte_length - op_marker - size);

                count--;

                byte_length -= op_size;

                return true;
            }

            friend std::ostream & operator<<(std::ostream & stream, const OPBuffer & ops)
            {
                return (stream.write((char *) &ops.byte_length, sizeof(ops.byte_length))
                            .write((char *) &ops.count, sizeof(ops.count))
                            .write((char *) &ops.size, sizeof(ops.size))
                            .write(ops.data, ops.byte_length));
                /*
                os << "[";

                if (op.count > 0) {

                    OPBuffer c = op.clone();

                    c.reset();

                    os << c.current();

                    if (op.count > 1)
                        do {
                            os << "," << c.next();
                        } while (!c.atEnd());
                }

                return os << "]";
                */
            }

            friend OPBuffer & operator<<(OPBuffer & ops, std::istream & stream)
            {
                stream.read((char *) &ops.byte_length, sizeof(ops.byte_length));
                stream.read((char *) &ops.count, sizeof(ops.count));
                unsigned s;
                stream.read((char *) &s, sizeof(s));
                ops.expand(s);
                stream.read(ops.data, ops.byte_length - 8);
                return ops;
            }
        };


        template <class Buffer> class OPString
        {
            public:
            typedef OPString<Buffer> OpString;
            
            typedef typename Buffer::OpChar OpChar;

          private:
            Buffer ops;

            unsigned clock = 0;

            unsigned sites = 0;

            int offset = 80000;

            idsite site = 0;

            int length = 0;

          public:
            OPString(unsigned s = 0) : ops(8192), sites(s + 1), site(s)
            {
                OpChar op;
                op.setCodePoint(' ');
                op.setIDSite(s);
                op.setIDClock(clock);
                op.setOriginSite(s);
                op.setOriginClock(clock++);
                ops.insert(op);
            }

            ~OPString() {}

            unsigned size() { return length; }

          private:
            OpChar findOpAtIndex(unsigned index)
            {

                int offset = -1;

                OpChar prev_op;

                for (OpChar op = ops.current(); !ops.atEnd(); op = ops.next()) {
                    if (op.isDeleteOperation()) {
                        offset -= (unsigned) op.isOrigin(prev_op);
                    } else {
                        offset++;
                    }

                    if (offset >= index) break;

                    prev_op = op;
                }

                return ops.current();
            }


            unsigned insertOp(OpChar & op, unsigned short_circuit = 0)
            {

                // If the op is new (root of the tree) insert
                for (OpChar origin_candidate = ops.reset().current(); !ops.atEnd();
                     origin_candidate               = ops.next()) {

                    if (op.isOrigin(origin_candidate)) {

                        OpChar peer_candidate = ops.next();

                        if (op.isDeleteOperation())
                        // Delete Operations immediatelly follow there origin operation. This ensures that it's effect
                        // applies BEFORE any other Operation, maintaining the relation [A <=deletes= B]. Since this
                        // operation must remain idempotent, any number of delete operations on a single origin
                        // operation must be ignored after the first one that is observed.
                        {
                            if (peer_candidate.isDeleteOperation() && peer_candidate.isOrigin(origin_candidate))
                                // For simplicity's sake, just ignore any delete operation for a givin origin following
                                // an initial one.
                                return false;
                        } else {
                            while (!ops.atEnd()) {
                                if (peer_candidate == op || (peer_candidate.getIDSite() == op.getIDSite() &&
                                                             peer_candidate.getIDClock() >= op.getIDClock()))
                                // Prevent duplicate operations from being inserted.
                                {
                                    return false;
                                }

                                if (peer_candidate < op && !peer_candidate.isDeleteOperation()) {
                                    break;
                                }

                                peer_candidate = ops.next();
                            }
                        }

                        if (!ops.insert(op)) {
                            std::cout << "Unable to insert " << op.id
                                      << ". Cannot Allocate enough memory to expand ops." << std::endl;
                            return false;
                        }

                        return true;
                    }
                }

                // if here no origin candidate has been found.
                std::cout << "Unable to locate position of op: " << op << std::endl;

                // complete
                return false;
            }

          public:
            bool remove(unsigned index, unsigned length)
            {

                for (unsigned i = 0; i < length; i++) {
                    OpChar source_op = findOpAtIndex(index--);
                    OpChar op;

                    if (source_op.isDeleteOperation()) std::cout << "DELETE" << std::endl;

                    op.setValue(0);

                    op.setIDSite(site);
                    op.setIDClock(clock++);
                    op.setOriginSite(source_op.getIDSite());
                    op.setOriginClock(source_op.getIDClock());

                    if (!insertOp(op)) return false;

                    length--;
                }

                return true;
            }

            bool insert(unsigned index, const std::wstring & str)
            {

                OpChar source_op = findOpAtIndex(index);

                unsigned str_len = str.length();

                for (unsigned i = 0; i < str_len; i++) {

                    OpChar op;

                    op.setValue(str[i]);

                    op.setIDSite(site);
                    op.setIDClock(clock++);
                    op.setOriginSite(source_op.getIDSite());
                    op.setOriginClock(source_op.getIDClock());

                    if (!insertOp(op)) return false;

                    length++;

                    source_op = op;
                }

                return true;
            }

            friend std::ostream & operator<<(std::ostream & stream, const OpString & string)
            {
                return stream.write((char *) &string.site, sizeof(string.site))
                           .write((char *) &string.sites, sizeof(string.sites))
                           .write((char *) &string.clock, sizeof(string.clock))
                           .write((char *) &string.length, sizeof(string.length))
                       << string.ops;
            }

            friend OPString & operator<<(OpString & string,
                                                                std::istream & stream)
            {
                stream.read((char *) &string.site, sizeof(string.site));
                stream.read((char *) &string.sites, sizeof(string.sites));
                stream.read((char *) &string.clock, sizeof(string.clock));
                stream.read((char *) &string.length, sizeof(string.length));
                string.ops << stream;
                return string;
            }

            void fromFileStream(std::ifstream & stream)
            {

                OpChar source_op = findOpAtIndex(0);

                while (stream.good()) {

                    char buffer[8];

                    stream.read(buffer, 8);

                    unsigned data_size = stream.gcount();
                    //*
                    for (int i = 0; i < data_size; i++) {
                        OpChar op;
                        op.setCodePoint((wchar_t) buffer[i]);
                        op.setIDSite(site);
                        op.setIDClock(clock++);
                        op.setOriginSite(source_op.getIDSite());
                        op.setOriginClock(source_op.getIDClock());
                        insertOp(op);
                        length++;
                        source_op = op;
                    }
                    //*/
                }
            }

            wchar_t operator[](unsigned index)
            {

                if (index < offset) {
                    offset = -1;
                    ops.reset();
                }

                OpChar prev_op;

                for (OpChar op = ops.current(); !ops.atEnd(); op = ops.next()) {
                    if (op.isDeleteOperation()) {
                        offset -= (unsigned) op.isOrigin(prev_op);
                    } else {

                        if (offset == index) return op.getWChar();

                        offset++;
                    }

                    prev_op = op;
                }

                return (wchar_t) 0;
            }


            // JS PROPERTIES
            /*
                Returns a string of the consumable value.
            */
            std::wstring getValue() const
            {

                unsigned offset = 0;

                Buffer ops_ = ops.clone();

                OpChar prev_op;

                for (OpChar op = ops_.reset().current(); !ops_.atEnd(); op = ops_.next()) {
                    if (op.isDeleteOperation()) {
                        offset -= (unsigned) op.isOrigin(prev_op);
                    } else {
                        uber_buffer[offset++] = (wchar_t) op.getWChar();
                    }

                    prev_op = op;
                }

                uber_buffer[offset] = 0;

                return std::wstring(uber_buffer);
            }

            void setValue(int x) {}


            // Returns a string value that is a JSON formated representation of the String's internal state.
            std::string getInspect() const
            {

                std::ostringstream ostring;

                ostring << *this;

                return ostring.str();
            }

            void setInspect(int x) {}

            void destroy() { delete this; }

            OpString & split()
            {

                OpString & string = *new OpString(sites++);

                ops.copy(string.ops);

                string.clock = clock;

                return string;
            }

            bool merge(OpString & other)
            {

                if (other.site == site || &other == this) return false;

                bool result = false;

                Buffer ops_ = other.ops.clone();

                for (OpChar op = ops_.reset().current(); !ops_.atEnd(); op = ops_.next()) {
                    if (insertOp(op)) result = true;
                }

                if (other.clock > clock) clock = other.clock;

                return result;
            }

            /* ((/ruminate/docs/c++/objects/crdt/offsetToRef))[sync, comment]
                #Offset to Reference

                Givin an integer offset returns an encode integer for the Address of the token at the offset.
            */
            unsigned offsetToRef(unsigned offset)
            {
                const OpChar & op = findOpAtIndex(offset);

                return op.toUnsigned();
            }

            /* ((/ruminate/docs/c++/objects/crdt/refToOffset))[sync, comment]
                #refToOffset

                Givin an encoded integer Address returns the offset of the token within the derived string.
            */
            unsigned refToOffset(unsigned ref)
            {

                unsigned offset = 0;

                OpChar comp_op(ref);

                OpChar prev_op;

                for (OpChar op = ops.reset().current(); !ops.atEnd(); op = ops.next()) {
                    if (op.isDeleteOperation()) {
                        offset -= (unsigned) op.isOrigin(prev_op);
                    } else if (ref == op) {
                        return offset;
                    } else {
                        uber_buffer[offset++] = (wchar_t) op.getWChar();
                    }

                    prev_op = op;
                }

                return 0;
            }
        };
    } // namespace STRING
} // namespace RUMINATE
