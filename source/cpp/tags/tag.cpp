#include "./tags.h"
#include <cmath>

using namespace RUMINATE::TAG;

wstring Tag::getText()
{
	if(type != TYPES::STRING)
		return L"";

	return * str_val;
}

double Tag::getDouble()
{
	if(type != TYPES::DOUBLE)
		return nan("");

	return dbl_val;
}

long long Tag::getLongInt()
{
	if(type != TYPES::INT)
		return 0;

	return int_val;
}
