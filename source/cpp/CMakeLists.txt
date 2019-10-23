cmake_minimum_required(VERSION 3.15)

#SET (CMAKE_CXX_STANDARD 17)

SET (CMAKE_C_FLAGS_INIT                "-std=c99")
SET (CMAKE_C_FLAGS_DEBUG_INIT          "-O0 -g -Wall")
SET (CMAKE_C_FLAGS_MINSIZEREL_INIT     "-Os -DNDEBUG")
SET (CMAKE_C_FLAGS_RELEASE_INIT        "-O3 -DNDEBUG")
SET (CMAKE_C_FLAGS_RELWITHDEBINFO_INIT "-O2 -g")


SET (CMAKE_CXX_FLAGS_INIT                "-stdlib=libc++ -std=c++17 -fdeclspec -pthread")
SET (CMAKE_CXX_FLAGS_DEBUG          	 "-O0 -g -Wall")
SET (CMAKE_CXX_FLAGS_MINSIZEREL_INIT     "-O2 -DNDEBUG")
SET (CMAKE_CXX_FLAGS_RELEASE_INIT        "-O3 -DNDEBUG")
SET (CMAKE_CXX_FLAGS_RELWITHDEBINFO_INIT "-O2 -g")

## Use the variable PROJECT_NAME for changing the target name
set( PROJECT_NAME "ruminate" )
set (ruminate_VERSION_MAJOR 0)
set (ruminate_VERSION_MINOR 1)
set (ruminate_VERSION_PATCH 0)

set(Boost_INCLUDE_DIRS, "/usr/include/boost")
set(Boost_LIBRARY_DIRS, "/usr/lib/boost")

## Set our project name
project(${PROJECT_NAME})

###USE BOOST LIBRARY
find_package(Boost
	# Minimum or EXACT version e.g. 1.67.0
  1.65      			
  # Fail with error if Boost is not found
  REQUIRED             		
  # Boost libraries by their canonical name
  COMPONENTS system
  # e.g. "date_time" for "libboost_date_time"
  )  

set(Boost_USE_MULTITHREADED ON)


list(APPEND CMAKE_CXX_SOURCE_FILE_EXTENSIONS h)


## Compiler Library
File(GLOB CompilerFiles "compiler/*")
add_library(Compiler STATIC ${CompilerFiles})

## Database Library
File(GLOB DatabaseFiles "database/include/*")
add_library(Database STATIC ${DatabaseFiles})

## FileSystem Library
add_library(FileDB STATIC database/include/base.h database/file/file_db.h database/file/file_db.cpp)
target_link_libraries(FileDB PUBLIC Database)


## Use all the *.cpp files we found under this folder for the project
FILE(GLOB SRCS
 
	"main.cpp"
	"definitions.h"
	"database/compiler/compiler.h"
	"database/include/*"
	"container/*"
	"note/*"
	"query/*"
	"string/*"
	"tags/*"
	"uid/*"
	"text_command/*"
	"ui/*"
	"utils/*"
	"localization/*"
	"server/*"
) 

## Add Include Directories
include_directories(${PROJECT_NAME} PRIVATE "container")
include_directories(${PROJECT_NAME} PRIVATE "database/include")
include_directories(${PROJECT_NAME} PRIVATE "note")
include_directories(${PROJECT_NAME} PRIVATE "query")
include_directories(${PROJECT_NAME} PRIVATE "string")
include_directories(${PROJECT_NAME} PRIVATE "tags")
include_directories(${PROJECT_NAME} PRIVATE "ui")
include_directories(${PROJECT_NAME} PRIVATE "uid")
include_directories(${PROJECT_NAME} PRIVATE "utils")
include_directories(${PROJECT_NAME} PRIVATE "server")

if($BOOST_FOUND)
	include_directories(${PROJECT_NAME} PRIVATE ${Boost_INCLUDE_DIRS})
endif()

## Define the executable
add_executable(${PROJECT_NAME} ${SRCS})

target_link_libraries(${PROJECT_NAME} Compiler FileDB ${Boost_LIBRARIES})

set_target_properties(${PROJECT_NAME} PROPERTIES VS_DEBUGGER_COMMAND_ARGUMENTS "C:\test")

SET (CMAKE_CODELITE_USE_TARGETS ON)

