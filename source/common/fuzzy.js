function loopRL(search_string, match_string, search_window, base){
	
	const check = search_string[search_string.length-1];

	if(base == 0)
		base = search_string.length-1;

	const s_len = search_string.length,
		m_len = match_string.length;

	while(base < m_len){

		while(match_string[++base] !== check){
			if(base >= m_len)
				return {score:-1}
		}

		let mi = base,
			floor = Math.max(base-search_window, -1),
			si = s_len-2,
			score = 0,
			char = search_string[si],
			matches = [],
			match = 1;

		while(si > -1 && --mi > floor){

			if(char == match_string[mi]){
				match++;
				char = search_string[--si];
			}else{
				if(match > 0)
					matches.unshift(mi+1, match)

				match = 0;
				
				score++;
			}
		}

		if(si == -1){
			matches.unshift(mi, match)
			return {score, matches, skip : mi + s_len + 2}
		} else{
			base += s_len - si - 1;
		}
	}

	return  {score:-1}
}

function loopLR(search_string, match_string, search_window, base){
	const check = search_string[0];

	if(base == 0)
		base--;

	if(base >= match_string.length)
		return {score:-1}

	const s_len = search_string.length,
		m_len = match_string.length;

	while(base < m_len){

		while(match_string[++base] !== check){
			if(base >= m_len)
				return {score:-1}
		}

		let mi = base,
			ceil = Math.min(base+search_window, m_len),
			si = 1,
			score = 0,
			char = search_string[si],
			matches = [],
			match = 1;

		while(si < s_len && ++mi < ceil){

			if(char == match_string[mi]){
				match++;
				char = search_string[++si];
			}else{
				if(match > 0)
					matches.push(mi-match, match)

				match = 0;
				
				score++;
			}
		}

		if(si == s_len){
			matches.push(mi-match+1, match);
			return {score, matches, skip:base + si - 1}
		} else{
			base += si - 1;
		}
	}

	return  {score:-1}
}



export default function(search_string, match_string, BEST = false, search_window = search_string.length << 1){

	if(search_string.length > match_string.length)
		return {score:-1};

	if(search_string.length == match_string.length)
		if(search_string == match_string)
			return {score:0, matches : [{index:0, str: search_string}]}
		else 
			return {score:-1};

	search_window = Math.min(Math.max(search_window, search_string.length + 2), match_string.length);


	var base = 0;

	if(BEST){
		var result = null, results = [];

		while((result = loopLR(search_string, match_string, search_window, base)).score > -1)
			results.push(result), base = result.skip;

		return results.length > 0 ? results.sort((a,b)=> a.score < b.score ? -1 : 1).shift() : {score:-1}
	}
	/* First */
	else return loopLR(search_string, match_string, search_window, base);
}