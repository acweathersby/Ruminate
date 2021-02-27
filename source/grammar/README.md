### Query Grammr

**`container_clause [(? | :f | :filter  ) filter_clause]? [(: | :s | :sort )  sort_clause]?`**

#### ```container_clause```
[( wild_card | container_name ) \.] note_name

##### ```container_name | note_name```
(wild_card | text_phrase )

#### ```filter_clause```
(OR | or | Or | ||)
(AND | and | And | &&)
(JUX = text_phrase )

#### ```sort_clause```
TAG_NAME (Ascending | Descending)?
Created (Ascending | Descending)?
Modified (Ascending | Descending)?
