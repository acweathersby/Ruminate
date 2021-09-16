# Core Library Objects
- CRDT
- NOTE
- QUERY

# Core Technologies

## Idempotent notes

## CRDT Text Storage

Notes are stored in causal relation data structures that provide inherit mechanisms
for handling concurrent note updates, unlimited histories, and trivial merging of
note data from different sources.

## Query Language Linking

Ruminate utilizes a powerful query language to define connections between notes. These
connection are created ad hoc and can be used to integrate one note into any number of
other notes. 

> As of now the query language is a traditional procedural language, though research
> is ongoing in developing AI models that can provide a more intuitive natural language
> processing query system.

## Built In Syntax Management System.

## Integration with other. 

## Language Agnostic.









# Core Note DB Columns

`UUID` - Main Identifier Of Note (128bit, atomic)

`local_key` - Internal Database specific simple key (integer, atomic)

### Container - A String for user friendly location information (`mutable`)
> Same note can show up in multiple container ["linking"]
>
> Two tables | Active | Deleted

`[local_key, container_string]`

### Tag - A List of string data for meta anaylsis
> Two tables | Active | Deleted

`[local_key, string_data, EPOCH_STAMP]`

# Content - A crCRDT String storing the note's contents
`[local_key, crCRDT]`

# Core Meta Information

Site UUID - Globally unique site built from user information + device information. 
Site Name - Human friendly name for a site

Links are references to linking information

# Language Server?

# Tables

## Tags

> # HASH TABLE

tag_strings -> tag_string > tag_hash

## Note

note_uuid -> note_uuid > note_id

note_data -> note_id > note_crdt #volatile

note_tag_meta -> note_id > tag_hash

note_link_meta -> note_uuid | note_link_id > note_link_data ; note_link_meta  #volatile

## Site

site_id > site_uuid > local_site_id

site_name > site_uuid > site_friendly_name_string

## Query



