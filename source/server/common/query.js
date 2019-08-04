export default function(
    serverLookupScript // Generated function script used to lookup info on backing store. 
) {
    /** ((new_note)(js_crawler.function))

	This function handles queries using thread primitives to split query 
	results over multiple threads to ensure maximum throughput.

	Queries occur in multiple passes. 
		- The first pass generates a list of note queriables that are comprised of 
			a. UID
			b. ID - TAG - BODY information
		 
		 These are selected based on the container portion of the query. i.e. ( => [container.container. id ] <= : ...)
		 Multiple lists of this type can be generated based on strategies such as 
		 	- One MOAL (Mother of all lists), later split into equal parts
		 	- One list per container
		 	- Round Robin placement of lists generate per container into buckets
		 These strategies can allow container group lookup to be distributed between computing units

		- Once a set of lists are generated, they are distributed to individual computing units to handle the second query action
		Each note is matched against the second query portion (... : =>[...]<=), and winning items are placed in output lists.

		Once all inputs have been processed, items are sorted based on the query criteria, or based on modified date. Results with duplicate UIDs are removed. 

		A list of UIDs are passed back to the client. The client can decide to query the server for the actual note contents, or do something else with the UID information.
	*/
	return async function(query){
		return [];
	}
}
