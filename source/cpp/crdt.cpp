#include <iostream>
#include <cstring>
#include <sstream>

namespace crdt {

typedef unsigned short opvalue;
typedef unsigned char idsite;
typedef unsigned int idclock;
typedef unsigned int idindex;

static wchar_t uber_buffer[100000];

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
		return os << "{\"s\":" << (unsigned short)i.site << ",\"t\":" << i.clock << "}";
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


struct ASCII {

	char val;


	void setFromWChar(wchar_t c) {
		val = c & 0xFF;
	}

	void setFromChar(char c) {
		val = c;
	}
	unsigned byteSize() const {
		return 1;
	}


	wchar_t getWChar() const {
		return (wchar_t) val;
	}

	char getChar() const {
		return val;
	}

	bool isDelete() const {
		return 0 == val;
	}

	static const unsigned max_size() {
		return 1;
	}

	unsigned unsignedValue() const {
		return  (unsigned) val;
	}
};

template  <class Encoding>
struct OPChar {

	Encoding data;

	void setFromWChar(wchar_t c) {
		data.setFromWChar(c);
	}

	void setFromChar(char c) {
		data.setFromChar(c);
	}

	wchar_t getWChar() const {
		return data.getWChar();
	}

	char getChar() const {
		return data.getChar();
	}

	bool isDeleteOperation() const {
		return 0 == data.unsignedValue();
	}

	unsigned byteSize() const {
		return data.byteSize();
	}

	static const unsigned max_size() {
		return sizeof(Encoding);
	}
};

template  <class MetaStamp, class Operator>
struct CharOp {

	MetaStamp id = MetaStamp();
	MetaStamp origin = MetaStamp();
	Operator data = Operator(); //UTF 16 value

	static const unsigned max_size() {
		return sizeof(MetaStamp) * 2 + sizeof(Operator);
	}

	bool isDeleteOperation() const {
		return data.isDeleteOperation();
	}

	unsigned byteSize() const {
		return data.byteSize() + sizeof(MetaStamp) * 2;
	}

	void setValue(wchar_t val) {
		data.setFromWChar(val);
	}

	wchar_t getValue() const {
		return data.getWChar();
	}

	wchar_t getWChar() const {
		return data.getWChar();
	}


	void setIDSite(const unsigned v) {
		id.site = v;
	}

	void setIDClock(const unsigned v) {
		id.clock = v;
	}

	void setOriginSite(const unsigned v) {
		origin.site = v;
	}

	void setOriginClock(const unsigned v) {
		origin.clock = v;
	}

	unsigned char getIDSite() const {
		return id.site;
	}

	unsigned getIDClock() const {
		return id.clock;
	}

	unsigned char getOriginSite() const {
		return origin.site;
	}

	unsigned getOriginClock() const {
		return origin.clock;
	}

	bool isOrigin(const CharOp<MetaStamp, Operator>& op) const {
		return (op.getIDClock() == getOriginClock() && op.getIDSite() == getOriginSite());
	}

	bool isSame(const CharOp<MetaStamp, Operator>& op) const {
		return ((int)op.getIDClock() - (int)getIDClock() + (int)op.getIDSite() - (int)getIDSite()) == 0;
	}

	friend std::ostream& operator << (std::ostream& os, const CharOp<MetaStamp, Operator>& op) {
		if (op.isDeleteOperation())
			return os << "{\"id\":" << op.id << ",\"o\":" << op.origin << ",\"v\":\"DEL\"}";
		return os << "{\"id\":" << op.id << ",\"o\":" << op.origin << ",\"v\":\"" << (char) op.getValue() << "\"}";
		return os;
	}

	/***** Compares the ids site and clock value *****/
	friend bool operator == (const CharOp<MetaStamp, Operator>& a, const CharOp<MetaStamp, Operator>& b) {
		return a.isSame(b);
	}

	/***** Compares the ids site and clock value *****/
	friend bool operator < (const CharOp<MetaStamp, Operator>& a, const CharOp<MetaStamp, Operator>& b) {
		return  a.getIDClock() < b.getIDClock() || (a.getIDClock() == b.getIDClock() && a.getIDSite() < b.getIDSite());
	}

	/***** Compares the ids site and clock value *****/
	friend bool operator > (const CharOp<MetaStamp, Operator>& a, const CharOp<MetaStamp, Operator>& b) {
		return  a.getIDClock() > b.getIDClock() || (a.getIDClock() == b.getIDClock() && a.getIDSite() > b.getIDSite());
	}


//		CharOp<MetaStamp, Operator>& operator= (char& c ){ return  * ( CharOp<MetaStamp, Operator> * ) &c;}
};

template  <class Operator>
struct OPBuffer {

	unsigned byte_length = 0;

	unsigned op_marker = 0;

	unsigned size = 8192;

	unsigned count = 0; // Number of operations stored

	char * data = NULL;

	bool CLONED = false;

	Operator last;

	OPBuffer() {}

	OPBuffer(unsigned size) {
		data = new char[size];
	}

	~OPBuffer() {

		if(!CLONED)
			delete[] data;
	}

	void copy(OPBuffer& copy_to_buffer) const {

		if(copy_to_buffer.data == data || copy_to_buffer.CLONED){
			return; // Do not overwite data!
		}

		copy_to_buffer.byte_length = byte_length;
		copy_to_buffer.op_marker = op_marker;
		copy_to_buffer.count = count;

		if(copy_to_buffer.size != size){
			delete[] copy_to_buffer.data;
			copy_to_buffer.data = new char[size];
		}

		std::memcpy(copy_to_buffer.data, data, size);

		copy_to_buffer.size = size;

		return;
	}

	OPBuffer(const OPBuffer& buffer) {
		byte_length = buffer.byte_length;
		op_marker = buffer.op_marker;
		size = buffer.size;
		data = buffer.data;
		count = buffer.count;
		last = buffer.last;
	}

	OPBuffer clone() const {

		OPBuffer copy;

		copy.byte_length = byte_length;
		copy.op_marker = op_marker;
		copy.size = size;
		copy.count = count;
		copy.last = last;
		copy.data =  data;
		copy.CLONED = true;

		return copy;
	}

	bool maxSizeReached(unsigned allocation_amount) const {
		return byte_length + allocation_amount >= size;
	}

	inline bool atEnd() const {
		//std::cout << "At end? "<< ((op_marker >= byte_length) ? "TRUE" : "FALSE") <<" count: " << count << " current size: " << size << " marker:" << op_marker << "byte_length: " << byte_length << std::endl;
		return op_marker >= byte_length;
	}

	inline bool atBeginning() const {
		return op_marker <= 0;
	}

	Operator current() const {
		return * ((Operator *) &data[op_marker]);
	}

	Operator next() {

		Operator curr = current();

		if (atEnd()){
			return last;
		}

		op_marker += curr.byteSize();

		last = curr;

		return current();
	}

	/* Resets the op_marker to 0, pointer to the first Operator in the buffer. */

	OPBuffer& reset () {
		op_marker = 0;
		return * this;
	}


	/* Doubles the size of the buffer or returns false if not enough memory can be allocated. */
	bool expand() {

		std::cout << "expanding" << size << std::endl;

		char * n_buffer = new char[size << 1];

		if (n_buffer == NULL)
			return false;

		std::memcpy(n_buffer, data, byte_length);

		delete[] data;

		data = n_buffer;

		return true;
	}

	/*
		Inserts given Operator into buffer at the current op_marker.
		Operators following Operator are shifted up the buffer by current().byteSize()
	*/
	bool insert(Operator& op) {

		if (maxSizeReached(op.byteSize()) && !expand())
			return false; //Unable to allocate enough space to expand buffer.

		char * a = &data[op_marker];

		unsigned op_size = op.byteSize();
		//*
		if (!atEnd())
		{
			std::memmove(
			    &data[op_marker + op_size],
			    a,
			    byte_length - op_marker
			);
		}
		//*/

		count++;

		std::memcpy(a, &op, op_size);

		byte_length += op_size;

		return true;
	}

	/*
		Removes Operator into buffer at the current op_marker.
		Operators following Operator are shifted down the buffer by current().byteSize()
	*/
	bool remove() {

		unsigned op_size = current().byteSize();

		if (maxSizeReached(op_size) && !expand())
			return false; //Unable to allocate enough space to expand buffer.

		char * a = &data[op_marker];
		char * b = &data[op_marker + op_size];

		std::memmove(a, b, byte_length - op_marker - size);

		count--;

		byte_length -= op_size;

		return true;
	}
};


template <class CharOperation, class Buffer>
class OPString  {

private:

	Buffer ops;

	unsigned clock = 0;

	unsigned sites = 0;

	idsite site = 0;

public:


	OPString(unsigned site)
		: site(site), sites(site + 1), ops(8192)
	{
		CharOperation op;
		op.setValue(' ');
		op.setIDSite(site);
		op.setIDClock(clock);
		op.setOriginSite(site);
		op.setOriginClock(clock++);
		ops.insert(op);
	}

	~OPString() {
	}

private:

	CharOperation findOpAtIndex(unsigned index) {

		int offset = -1;

		CharOperation prev_op;

		for (CharOperation op = ops.reset().current(); !ops.atEnd(); op = ops.next())
		{	
			if (op.isDeleteOperation())
			{
				offset -= (unsigned) op.isOrigin(prev_op);
			}
			else 
			{
				offset++;
			}

			if (offset >= index)
				break;

			prev_op = op;
		}

		return ops.current();
	}


	unsigned insertOp(CharOperation& op, unsigned short_circuit = 0) {
		//If the op is new (root of the tree) insert
		int i = 0;
		for (CharOperation candidate = ops.reset().current(); !ops.atEnd(); candidate = ops.next())
		{

			if (op.isOrigin(candidate))
			{

				CharOperation peer_candidate = ops.next();				
				
				if(op.isDeleteOperation())
				{
					if(peer_candidate.isDeleteOperation() && peer_candidate.isOrigin(candidate))
						return false;
				}
				else
				{
					while (!ops.atEnd())
					{
						if
						(
						    peer_candidate == op
						    ||
						    (
						        peer_candidate.getIDSite() == op.getIDSite()
						        && peer_candidate.getIDClock() >= op.getIDClock()
						    )
						)
						{
							return false;
						}
						if
						(	
							peer_candidate < op && !peer_candidate.isDeleteOperation()
						)
						{
							break;
						}

						peer_candidate = ops.next();
					}
				}

				if (!ops.insert(op)) 
				{
					std::cout << "Unable to insert " << op.id << ". Cannot Allocate enough memory to expand ops." << std::endl;
					return false;
				}

				return true;
			}
			i++;
		}

		//if here no candidate has been found.
		std::cout <<"Unable to locate position of op: " << op << std::endl;

		//complete
		return false;
	}

public:

	bool remove(unsigned index, unsigned length) {

		unsigned i = 0;

		for (; i < length; i++)
		{
			CharOperation source_op = findOpAtIndex(index--);
			CharOperation op;

			if(source_op.isDeleteOperation())
				std::cout << "DELETE" << std::endl;

			op.setValue(0);

			op.setIDSite(site);
			op.setIDClock(clock++);
			op.setOriginSite(source_op.getIDSite());
			op.setOriginClock(source_op.getIDClock());

			if (!insertOp(op)) return false;

			source_op = op;
		}

		return true;
	}

	bool insert(unsigned index, const std::wstring& str) {

		unsigned i = 0;

		CharOperation source_op = findOpAtIndex(index);

		unsigned str_len = str.length();

		for (; i < str_len; i++)
		{

			CharOperation op;

			op.setValue(str[i]);

			op.setIDSite(site);
			op.setIDClock(clock++);
			op.setOriginSite(source_op.getIDSite());
			op.setOriginClock(source_op.getIDClock());
			
			if (!insertOp(op)) return false;

			source_op = op;
		}

		return true;
	}

	friend std::ostream& operator << (std::ostream& os, const OPString<CharOperation, Buffer>& string) {

		os 	<< "{\"site\":" << (unsigned) string.site
		    << ",\"clock\":" << string.clock
		    << ",\"ops\":[";

		unsigned i = 0;

		
		Buffer ops = string.ops.clone();

		for (CharOperation op = ops.reset().current(); !ops.atEnd(); op = ops.next(), i++)
		{
			os << op;

			if (i < ops.count - 1)
				os << ",";
		}

		os << "]}";

		return os;
	}


	//JS PROPERTIES
	/*
		Returns a string of the consumable value.
	*/
	std::wstring getValue() const {
		
		unsigned offset = 0;

		Buffer ops_ = ops.clone(); 

		CharOperation prev_op;

		for (CharOperation op = ops_.reset().current(); !ops_.atEnd(); op = ops_.next())
		{	
			if (op.isDeleteOperation())
			{
				offset -= (unsigned) op.isOrigin(prev_op);
			}
			else {
				uber_buffer[offset++] = (wchar_t) op.getWChar();
			}

			prev_op = op;
		}

		uber_buffer[offset] = 0;

		return std::wstring(uber_buffer);
	}

	void setValue(int x) {}

	/*
		Returns a string value that represents the internal state of the CTString.
	*/
	std::string getInspect() const {

		std::ostringstream ostring;

		ostring << *this;

		return ostring.str();
	}

	void setInspect(int x) {}

	void destroy() {
		delete this;
	}

	OPString<CharOperation, Buffer>& split()  {

		OPString<CharOperation, Buffer>& string = * new OPString<CharOperation, Buffer>(sites++);

		ops.copy(string.ops);

		string.clock = clock;

		return string;
	}

	bool merge(OPString<CharOperation, Buffer>& other) 
	{
	
		if (other.site == site || &other == this)
			return false;

		bool result = false;

		Buffer ops_  = other.ops.clone(); 

		for (CharOperation op = ops_.reset().current(); !ops_.atEnd(); op = ops_.next())
		{	
			if (insertOp(op))
				result = true;
		}

		if (other.clock > clock)
			clock = other.clock;

		return result;
	}
};
}


#ifdef  JAVASCRIPT_WASM

#include <emscripten.h>
#include <emscripten/bind.h>

namespace javascript {

	using namespace crdt;
	using namespace emscripten;
	
	typedef CharOp <OP_ID, OPChar<ASCII>> ASCII_OP;
	typedef OPString<ASCII_OP, OPBuffer<ASCII_OP>> JSCRDTString;

	JSCRDTString *myTempPtr;
	// Binding code
	EMSCRIPTEN_BINDINGS(CDTString) {

		class_<JSCRDTString>("CTString")
		.constructor<int>()
		.function("merge", &JSCRDTString::merge)
		.function("split", &JSCRDTString::split, allow_raw_pointers())
		.function("insert", &JSCRDTString::insert)
		.function("delete", &JSCRDTString::remove)
		.function("destroy", &JSCRDTString::destroy)
		.property("inspect", &JSCRDTString::getInspect, &JSCRDTString::setInspect)											// CLASS FUNCTION
		.property("value", &JSCRDTString::getValue, &JSCRDTString::setValue)			// CLASS FUNCTION
		//.property("x", &MyClass::getX, &MyClass::setX)							// PUBLIC PROPERTY USING getters and setters
		//.class_function("getStringFromInstance", &MyClass::getStringFromInstance) // STATIC FUNCTION
		;
	}
}
#endif