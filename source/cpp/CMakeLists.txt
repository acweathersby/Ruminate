cmake_minimum_required(VERSION 3.15)

SET (CMAKE_CXX_STANDARD 17)

SET (CMAKE_C_FLAGS_INIT                "-Wall -std=c99")
SET (CMAKE_C_FLAGS_DEBUG_INIT          "-g")
SET (CMAKE_C_FLAGS_MINSIZEREL_INIT     "-Os -DNDEBUG")
SET (CMAKE_C_FLAGS_RELEASE_INIT        "-O3 -DNDEBUG")
SET (CMAKE_C_FLAGS_RELWITHDEBINFO_INIT "-O2 -g")


SET (CMAKE_CXX_FLAGS_INIT                "-Wall -stdlib=libc++ -std=c++17 -fdeclspec")
SET (CMAKE_CXX_FLAGS_DEBUG_INIT          "-g")
SET (CMAKE_CXX_FLAGS_MINSIZEREL_INIT     "-Os -DNDEBUG")
SET (CMAKE_CXX_FLAGS_RELEASE_INIT        "-O3 -DNDEBUG")
SET (CMAKE_CXX_FLAGS_RELWITHDEBINFO_INIT "-O2 -g")

## Use the variable PROJECT_NAME for changing the target name
set( PROJECT_NAME "ruminate" )
set (ruminate_VERSION_MAJOR 0)
set (ruminate_VERSION_MINOR 1)
set (ruminate_VERSION_PATCH 0)

## Compiler Library
File(GLOB CompilerFiles "compiler/*")
add_library(Compiler ${CompilerFiles})

## Set our project name
project(${PROJECT_NAME})

## Use all the *.cpp files we found under this folder for the project
FILE(GLOB SRCS 
	"main.cpp"
	"container/*"
	"database/*"
	"note/*"
	"query/*"
	"string/*"
	"tags/*"
	"uid/*"
	"ui/*"
	"utils/*"
)


## Add Include Directories
include_directories(${PROJECT_NAME} PRIVATE "container")
include_directories(${PROJECT_NAME} PRIVATE "database")
include_directories(${PROJECT_NAME} PRIVATE "note")
include_directories(${PROJECT_NAME} PRIVATE "query")
include_directories(${PROJECT_NAME} PRIVATE "string")
include_directories(${PROJECT_NAME} PRIVATE "tags")
include_directories(${PROJECT_NAME} PRIVATE "ui")
include_directories(${PROJECT_NAME} PRIVATE "uid")
include_directories(${PROJECT_NAME} PRIVATE "utils")

## Define the executable
add_executable(${PROJECT_NAME} ${SRCS})

target_link_libraries(${PROJECT_NAME} Compiler)
set_target_properties(${PROJECT_NAME} PROPERTIES VS_DEBUGGER_COMMAND_ARGUMENTS "C:\test")

SET (CMAKE_CODELITE_USE_TARGETS ON)

