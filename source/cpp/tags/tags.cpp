#include "./tags.h"
#include <iostream>

using namespace RUMINATE::TAG;

void TagContainer::addTag(wstring id)
{
	Tag t;

	t.id = id;

	tags.push_back(t);

	count++;
}

void TagContainer::addTag(wstring, double)
{
}

void TagContainer::addTag(wstring, int)
{
}

void TagContainer::addTag(wstring id, wstring str)
{
	Tag t;

	t.id = id;
	t.str_val = new wstring(str);

	tags.push_back(t);

	count++;
}

void TagContainer::removeTag(wstring)
{
}


Tag * RUMINATE::TAG::getMatchingTag(TagContainer& tags, const wstring& id)
{
	for(int i = 0; i < tags.size(); i++) {
		Tag * tag = tags[i];
		if(id.compare(tag->id) == 0) {
			std::cout<<"END------------------------------- " <<std::endl;
			return tag;
		}
	}
	return NULL;
};
