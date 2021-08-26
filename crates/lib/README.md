# Core Library Objects
- CRDT
- NOTE
- QUERY

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
`[local_key, ccCRDT]`

# Core Meta Information

Site UUID - Globally unique site built from user information + device information. 
Site Name - Human friendly name for a site

# Language Server?


#How to use:



