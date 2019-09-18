##
## Auto Generated makefile by CodeLite IDE
## any manual changes will be erased      
##
## Debug
ProjectName            :=ruminate_base
ConfigurationName      :=Debug
WorkspacePath          :=/home/anthony/work/active/apps/ruminate/codelite
ProjectPath            :=/home/anthony/work/active/apps/ruminate/codelite/ruminate_base
IntermediateDirectory  :=./Debug
OutDir                 := $(IntermediateDirectory)
CurrentFileName        :=
CurrentFilePath        :=
CurrentFileFullPath    :=
User                   :=Anthony
Date                   :=17/09/19
CodeLitePath           :=/home/anthony/.codelite
LinkerName             :=/usr/bin/clang++
SharedObjectLinkerName :=/usr/bin/clang++ -shared -fPIC
ObjectSuffix           :=.o
DependSuffix           :=.o.d
PreprocessSuffix       :=.i
DebugSwitch            :=-g 
IncludeSwitch          :=-I
LibrarySwitch          :=-l
OutputSwitch           :=-o 
LibraryPathSwitch      :=-L
PreprocessorSwitch     :=-D
SourceSwitch           :=-c 
OutputFile             :=$(IntermediateDirectory)/$(ProjectName)
Preprocessors          :=
ObjectSwitch           :=-o 
ArchiveOutputSwitch    := 
PreprocessOnlySwitch   :=-E
ObjectsFileList        :="ruminate_base.txt"
PCHCompileFlags        :=
MakeDirCommand         :=mkdir -p
LinkOptions            :=  
IncludePath            :=  $(IncludeSwitch). $(IncludeSwitch). 
IncludePCH             := 
RcIncludePath          := 
Libs                   := 
ArLibs                 :=  
LibPath                := $(LibraryPathSwitch). 

##
## Common variables
## AR, CXX, CC, AS, CXXFLAGS and CFLAGS can be overriden using an environment variables
##
AR       := /usr/bin/llvm-ar rcu
CXX      := /usr/bin/clang++
CC       := /usr/bin/clang
CXXFLAGS :=  -g -O0 -Wall -std=c++17 -fdeclspec  $(Preprocessors)
CFLAGS   :=  -g -O0 -Wall $(Preprocessors)
ASFLAGS  := 
AS       := /usr/bin/llvm-as


##
## User defined environment variables
##
CodeLiteDir:=/usr/share/codelite
Objects0=$(IntermediateDirectory)/up_up_source_cpp_main.cpp$(ObjectSuffix) $(IntermediateDirectory)/up_up_source_cpp_js_entry.cpp$(ObjectSuffix) $(IntermediateDirectory)/up_up_source_cpp_compiler_gnql_cpp.cpp$(ObjectSuffix) $(IntermediateDirectory)/up_up_source_cpp_compiler_parser.cpp$(ObjectSuffix) $(IntermediateDirectory)/up_up_source_cpp_compiler_parse_buffer.cpp$(ObjectSuffix) $(IntermediateDirectory)/up_up_source_cpp_query_query.cpp$(ObjectSuffix) $(IntermediateDirectory)/up_up_source_cpp_note_note.cpp$(ObjectSuffix) $(IntermediateDirectory)/up_up_source_cpp_database_base.cpp$(ObjectSuffix) 



Objects=$(Objects0) 

##
## Main Build Targets 
##
.PHONY: all clean PreBuild PrePreBuild PostBuild MakeIntermediateDirs
all: $(OutputFile)

$(OutputFile): $(IntermediateDirectory)/.d $(Objects) 
	@$(MakeDirCommand) $(@D)
	@echo "" > $(IntermediateDirectory)/.d
	@echo $(Objects0)  > $(ObjectsFileList)
	$(LinkerName) $(OutputSwitch)$(OutputFile) @$(ObjectsFileList) $(LibPath) $(Libs) $(LinkOptions)

MakeIntermediateDirs:
	@test -d ./Debug || $(MakeDirCommand) ./Debug


$(IntermediateDirectory)/.d:
	@test -d ./Debug || $(MakeDirCommand) ./Debug

PreBuild:


##
## Objects
##
$(IntermediateDirectory)/up_up_source_cpp_main.cpp$(ObjectSuffix): ../../source/cpp/main.cpp $(IntermediateDirectory)/up_up_source_cpp_main.cpp$(DependSuffix)
	$(CXX) $(IncludePCH) $(SourceSwitch) "/home/anthony/work/active/apps/ruminate/source/cpp/main.cpp" $(CXXFLAGS) $(ObjectSwitch)$(IntermediateDirectory)/up_up_source_cpp_main.cpp$(ObjectSuffix) $(IncludePath)
$(IntermediateDirectory)/up_up_source_cpp_main.cpp$(DependSuffix): ../../source/cpp/main.cpp
	@$(CXX) $(CXXFLAGS) $(IncludePCH) $(IncludePath) -MG -MP -MT$(IntermediateDirectory)/up_up_source_cpp_main.cpp$(ObjectSuffix) -MF$(IntermediateDirectory)/up_up_source_cpp_main.cpp$(DependSuffix) -MM ../../source/cpp/main.cpp

$(IntermediateDirectory)/up_up_source_cpp_main.cpp$(PreprocessSuffix): ../../source/cpp/main.cpp
	$(CXX) $(CXXFLAGS) $(IncludePCH) $(IncludePath) $(PreprocessOnlySwitch) $(OutputSwitch) $(IntermediateDirectory)/up_up_source_cpp_main.cpp$(PreprocessSuffix) ../../source/cpp/main.cpp

$(IntermediateDirectory)/up_up_source_cpp_js_entry.cpp$(ObjectSuffix): ../../source/cpp/js_entry.cpp $(IntermediateDirectory)/up_up_source_cpp_js_entry.cpp$(DependSuffix)
	$(CXX) $(IncludePCH) $(SourceSwitch) "/home/anthony/work/active/apps/ruminate/source/cpp/js_entry.cpp" $(CXXFLAGS) $(ObjectSwitch)$(IntermediateDirectory)/up_up_source_cpp_js_entry.cpp$(ObjectSuffix) $(IncludePath)
$(IntermediateDirectory)/up_up_source_cpp_js_entry.cpp$(DependSuffix): ../../source/cpp/js_entry.cpp
	@$(CXX) $(CXXFLAGS) $(IncludePCH) $(IncludePath) -MG -MP -MT$(IntermediateDirectory)/up_up_source_cpp_js_entry.cpp$(ObjectSuffix) -MF$(IntermediateDirectory)/up_up_source_cpp_js_entry.cpp$(DependSuffix) -MM ../../source/cpp/js_entry.cpp

$(IntermediateDirectory)/up_up_source_cpp_js_entry.cpp$(PreprocessSuffix): ../../source/cpp/js_entry.cpp
	$(CXX) $(CXXFLAGS) $(IncludePCH) $(IncludePath) $(PreprocessOnlySwitch) $(OutputSwitch) $(IntermediateDirectory)/up_up_source_cpp_js_entry.cpp$(PreprocessSuffix) ../../source/cpp/js_entry.cpp

$(IntermediateDirectory)/up_up_source_cpp_compiler_gnql_cpp.cpp$(ObjectSuffix): ../../source/cpp/compiler/gnql_cpp.cpp $(IntermediateDirectory)/up_up_source_cpp_compiler_gnql_cpp.cpp$(DependSuffix)
	$(CXX) $(IncludePCH) $(SourceSwitch) "/home/anthony/work/active/apps/ruminate/source/cpp/compiler/gnql_cpp.cpp" $(CXXFLAGS) $(ObjectSwitch)$(IntermediateDirectory)/up_up_source_cpp_compiler_gnql_cpp.cpp$(ObjectSuffix) $(IncludePath)
$(IntermediateDirectory)/up_up_source_cpp_compiler_gnql_cpp.cpp$(DependSuffix): ../../source/cpp/compiler/gnql_cpp.cpp
	@$(CXX) $(CXXFLAGS) $(IncludePCH) $(IncludePath) -MG -MP -MT$(IntermediateDirectory)/up_up_source_cpp_compiler_gnql_cpp.cpp$(ObjectSuffix) -MF$(IntermediateDirectory)/up_up_source_cpp_compiler_gnql_cpp.cpp$(DependSuffix) -MM ../../source/cpp/compiler/gnql_cpp.cpp

$(IntermediateDirectory)/up_up_source_cpp_compiler_gnql_cpp.cpp$(PreprocessSuffix): ../../source/cpp/compiler/gnql_cpp.cpp
	$(CXX) $(CXXFLAGS) $(IncludePCH) $(IncludePath) $(PreprocessOnlySwitch) $(OutputSwitch) $(IntermediateDirectory)/up_up_source_cpp_compiler_gnql_cpp.cpp$(PreprocessSuffix) ../../source/cpp/compiler/gnql_cpp.cpp

$(IntermediateDirectory)/up_up_source_cpp_compiler_parser.cpp$(ObjectSuffix): ../../source/cpp/compiler/parser.cpp $(IntermediateDirectory)/up_up_source_cpp_compiler_parser.cpp$(DependSuffix)
	$(CXX) $(IncludePCH) $(SourceSwitch) "/home/anthony/work/active/apps/ruminate/source/cpp/compiler/parser.cpp" $(CXXFLAGS) $(ObjectSwitch)$(IntermediateDirectory)/up_up_source_cpp_compiler_parser.cpp$(ObjectSuffix) $(IncludePath)
$(IntermediateDirectory)/up_up_source_cpp_compiler_parser.cpp$(DependSuffix): ../../source/cpp/compiler/parser.cpp
	@$(CXX) $(CXXFLAGS) $(IncludePCH) $(IncludePath) -MG -MP -MT$(IntermediateDirectory)/up_up_source_cpp_compiler_parser.cpp$(ObjectSuffix) -MF$(IntermediateDirectory)/up_up_source_cpp_compiler_parser.cpp$(DependSuffix) -MM ../../source/cpp/compiler/parser.cpp

$(IntermediateDirectory)/up_up_source_cpp_compiler_parser.cpp$(PreprocessSuffix): ../../source/cpp/compiler/parser.cpp
	$(CXX) $(CXXFLAGS) $(IncludePCH) $(IncludePath) $(PreprocessOnlySwitch) $(OutputSwitch) $(IntermediateDirectory)/up_up_source_cpp_compiler_parser.cpp$(PreprocessSuffix) ../../source/cpp/compiler/parser.cpp

$(IntermediateDirectory)/up_up_source_cpp_compiler_parse_buffer.cpp$(ObjectSuffix): ../../source/cpp/compiler/parse_buffer.cpp $(IntermediateDirectory)/up_up_source_cpp_compiler_parse_buffer.cpp$(DependSuffix)
	$(CXX) $(IncludePCH) $(SourceSwitch) "/home/anthony/work/active/apps/ruminate/source/cpp/compiler/parse_buffer.cpp" $(CXXFLAGS) $(ObjectSwitch)$(IntermediateDirectory)/up_up_source_cpp_compiler_parse_buffer.cpp$(ObjectSuffix) $(IncludePath)
$(IntermediateDirectory)/up_up_source_cpp_compiler_parse_buffer.cpp$(DependSuffix): ../../source/cpp/compiler/parse_buffer.cpp
	@$(CXX) $(CXXFLAGS) $(IncludePCH) $(IncludePath) -MG -MP -MT$(IntermediateDirectory)/up_up_source_cpp_compiler_parse_buffer.cpp$(ObjectSuffix) -MF$(IntermediateDirectory)/up_up_source_cpp_compiler_parse_buffer.cpp$(DependSuffix) -MM ../../source/cpp/compiler/parse_buffer.cpp

$(IntermediateDirectory)/up_up_source_cpp_compiler_parse_buffer.cpp$(PreprocessSuffix): ../../source/cpp/compiler/parse_buffer.cpp
	$(CXX) $(CXXFLAGS) $(IncludePCH) $(IncludePath) $(PreprocessOnlySwitch) $(OutputSwitch) $(IntermediateDirectory)/up_up_source_cpp_compiler_parse_buffer.cpp$(PreprocessSuffix) ../../source/cpp/compiler/parse_buffer.cpp

$(IntermediateDirectory)/up_up_source_cpp_query_query.cpp$(ObjectSuffix): ../../source/cpp/query/query.cpp $(IntermediateDirectory)/up_up_source_cpp_query_query.cpp$(DependSuffix)
	$(CXX) $(IncludePCH) $(SourceSwitch) "/home/anthony/work/active/apps/ruminate/source/cpp/query/query.cpp" $(CXXFLAGS) $(ObjectSwitch)$(IntermediateDirectory)/up_up_source_cpp_query_query.cpp$(ObjectSuffix) $(IncludePath)
$(IntermediateDirectory)/up_up_source_cpp_query_query.cpp$(DependSuffix): ../../source/cpp/query/query.cpp
	@$(CXX) $(CXXFLAGS) $(IncludePCH) $(IncludePath) -MG -MP -MT$(IntermediateDirectory)/up_up_source_cpp_query_query.cpp$(ObjectSuffix) -MF$(IntermediateDirectory)/up_up_source_cpp_query_query.cpp$(DependSuffix) -MM ../../source/cpp/query/query.cpp

$(IntermediateDirectory)/up_up_source_cpp_query_query.cpp$(PreprocessSuffix): ../../source/cpp/query/query.cpp
	$(CXX) $(CXXFLAGS) $(IncludePCH) $(IncludePath) $(PreprocessOnlySwitch) $(OutputSwitch) $(IntermediateDirectory)/up_up_source_cpp_query_query.cpp$(PreprocessSuffix) ../../source/cpp/query/query.cpp

$(IntermediateDirectory)/up_up_source_cpp_note_note.cpp$(ObjectSuffix): ../../source/cpp/note/note.cpp $(IntermediateDirectory)/up_up_source_cpp_note_note.cpp$(DependSuffix)
	$(CXX) $(IncludePCH) $(SourceSwitch) "/home/anthony/work/active/apps/ruminate/source/cpp/note/note.cpp" $(CXXFLAGS) $(ObjectSwitch)$(IntermediateDirectory)/up_up_source_cpp_note_note.cpp$(ObjectSuffix) $(IncludePath)
$(IntermediateDirectory)/up_up_source_cpp_note_note.cpp$(DependSuffix): ../../source/cpp/note/note.cpp
	@$(CXX) $(CXXFLAGS) $(IncludePCH) $(IncludePath) -MG -MP -MT$(IntermediateDirectory)/up_up_source_cpp_note_note.cpp$(ObjectSuffix) -MF$(IntermediateDirectory)/up_up_source_cpp_note_note.cpp$(DependSuffix) -MM ../../source/cpp/note/note.cpp

$(IntermediateDirectory)/up_up_source_cpp_note_note.cpp$(PreprocessSuffix): ../../source/cpp/note/note.cpp
	$(CXX) $(CXXFLAGS) $(IncludePCH) $(IncludePath) $(PreprocessOnlySwitch) $(OutputSwitch) $(IntermediateDirectory)/up_up_source_cpp_note_note.cpp$(PreprocessSuffix) ../../source/cpp/note/note.cpp

$(IntermediateDirectory)/up_up_source_cpp_database_base.cpp$(ObjectSuffix): ../../source/cpp/database/base.cpp $(IntermediateDirectory)/up_up_source_cpp_database_base.cpp$(DependSuffix)
	$(CXX) $(IncludePCH) $(SourceSwitch) "/home/anthony/work/active/apps/ruminate/source/cpp/database/base.cpp" $(CXXFLAGS) $(ObjectSwitch)$(IntermediateDirectory)/up_up_source_cpp_database_base.cpp$(ObjectSuffix) $(IncludePath)
$(IntermediateDirectory)/up_up_source_cpp_database_base.cpp$(DependSuffix): ../../source/cpp/database/base.cpp
	@$(CXX) $(CXXFLAGS) $(IncludePCH) $(IncludePath) -MG -MP -MT$(IntermediateDirectory)/up_up_source_cpp_database_base.cpp$(ObjectSuffix) -MF$(IntermediateDirectory)/up_up_source_cpp_database_base.cpp$(DependSuffix) -MM ../../source/cpp/database/base.cpp

$(IntermediateDirectory)/up_up_source_cpp_database_base.cpp$(PreprocessSuffix): ../../source/cpp/database/base.cpp
	$(CXX) $(CXXFLAGS) $(IncludePCH) $(IncludePath) $(PreprocessOnlySwitch) $(OutputSwitch) $(IntermediateDirectory)/up_up_source_cpp_database_base.cpp$(PreprocessSuffix) ../../source/cpp/database/base.cpp


-include $(IntermediateDirectory)/*$(DependSuffix)
##
## Clean
##
clean:
	$(RM) -r ./Debug/


