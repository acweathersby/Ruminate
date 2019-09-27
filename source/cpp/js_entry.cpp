

#ifdef JAVASCRIPT_WASM
#include "./string/crdt.h"
#include <emscripten/val.h>
#include <emscripten/bind.h>
#include <emscripten.h>

namespace javascript
{

	using namespace crdt;
	using namespace emscripten;

	typedef CharOp <OP_ID, OPChar<ASCII>> ASCII_OP;
	typedef OPString<ASCII_OP, OPBuffer<ASCII_OP>> JSCRDTString;

	JSCRDTString *myTempPtr;
	// Binding code
	EMSCRIPTEN_BINDINGS(CDTString)
	{
		class_<JSCRDTString>("CTString")
		.constructor<int>()
		.function("merge", &JSCRDTString::merge)
		.function("split", &JSCRDTString::split, allow_raw_pointers())
		.function("insert", &JSCRDTString::insert)
		.function("delete", &JSCRDTString::remove)
		.function("destroy", &JSCRDTString::destroy)
		.function("getReferenceAtOffset", &JSCRDTString::offsetToRef)
		.function("getOffsetFromReference", &JSCRDTString::refToOffset)
		.function("getNextChar", &JSCRDTString::getNextChar)
		.function("reset", &JSCRDTString::reset)
		.function("toBuffer", &JSCRDTString::toBuffer)
		.function("fromBuffer", &JSCRDTString::fromBuffera)
		.property("byteSize", &JSCRDTString::getByteSize, &JSCRDTString::setByteSize)
		.property("inspect", &JSCRDTString::getInspect, &JSCRDTString::setInspect)
		.property("value", &JSCRDTString::getValue, &JSCRDTString::setValue)
		;
	}
}
#endif
