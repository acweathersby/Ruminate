#! /bin/bash

emcc ./source/cpp/crdt.cpp \
	-D JAVASCRIPT_WASM \
	-std=c++17 \
	-s WASM=1 \
	-O0 \
	--bind \
	-s ALLOW_MEMORY_GROWTH=1 \
	-s MALLOC=dlmalloc \
	-s MODULARIZE=1 \
	-s EXPORT_ES6=1 \
	-o ./source/cpp/crdt.asm.js
