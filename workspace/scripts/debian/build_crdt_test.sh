#! /bin/bash

echo $PWD

clang++ $PWD/source/cpp/note/crdt_test.cpp \
    -g \
    -I $PWD/source/cpp/ \
	-std=c++17 \
    -o $PWD/source/cpp/note/crdt_test 

./source/cpp/note/crdt_test