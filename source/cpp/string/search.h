#include <string>
#include <cstring>

namespace RUMINATE
{
	namespace STRING
	{
		template<class SourceString, class MatchCharT>
		inline void advanceBuffer(SourceString& source, MatchCharT * buffer, int& buffer_index, int& source_index, int buffer_size, int advance_amount = 1)
		{
			while(advance_amount-- > 0) {
				buffer_index = (buffer_index + 1) % buffer_size;
				buffer[buffer_index] = source[source_index++];
			}
		}

		template<class SourceString, class MatchCharT>
		int fuzzySearchRL(SourceString& source, const std::basic_string<MatchCharT>& match, int window_size = 48, unsigned base = 0)
		{
			int source_index = 0, source_length = source.size(), match_length = match.size(), buffer_end = -1;

			window_size = std::min(std::max(window_size, match_length), source_length);

			if(window_size < match_length)
				return -1;

			MatchCharT buffer[window_size+1];

			buffer[window_size] = 0;

			MatchCharT target = match[match_length - 1];

			advanceBuffer<SourceString, MatchCharT>(source, buffer, buffer_end, source_index, window_size, window_size);

			while(source_index <= source_length) {

				int mi = match_length-2, si = 1, score = 0, match_count = 0;

				while(buffer[buffer_end] != target) {

					if(source_index > source_length)
						return -1;

					advanceBuffer<SourceString, MatchCharT>(source, buffer, buffer_end, source_index, window_size);
				}

				si = (window_size + buffer_end-1) % window_size;

				while(mi > -1 && si != buffer_end) {

					if(buffer[si] == match[mi]) {
						match_count++;
						mi--;
					} else {
						if(match_count > 0); // Add to list of matches

						match_count = 0;

						score++;
					}

					si = (window_size + si-1) % window_size;
				}

				if(mi == -1)
					return score;
				else
					advanceBuffer<SourceString, MatchCharT>(source, buffer, buffer_end, source_index, window_size, (match_length - mi) - 1);
			}
			return -1;
		}

		template<class SourceString, class MatchCharT>
		int fuzzySearchLR(SourceString& source, const std::basic_string<MatchCharT>& match, int window_size = 48, unsigned base = 0)
		{
			int source_index = 0, source_length = source.size(), match_length = match.size(),buffer_end = -1;

			window_size = std::min(std::max(window_size, match_length), source_length);

			if(window_size < match_length)
				return -1;

			MatchCharT buffer[window_size+1];

			buffer[window_size] = 0;

			MatchCharT target = match[match_length - 1];

			advanceBuffer<SourceString, MatchCharT>(source, buffer, buffer_end, source_index, window_size, window_size);

			while(source_index <= source_length) {

				int mi = 1, si = 1, score = 0, match_count = 0;

				while(buffer[buffer_end] != target) {

					if(source_index > source_length)
						return -1;

					advanceBuffer<SourceString, MatchCharT>(source, buffer, buffer_end, source_index, window_size);
				}

				si = (window_size + buffer_end+1) % window_size;

				while(mi < match_length && si != buffer_end) {

					if(buffer[si] == match[mi]) {
						match_count++;
						mi++;
					} else {
						if(match_count > 0); // Add to list of matches

						match_count = 0;

						score++;
					}

					si = (window_size + si+1) % window_size;
				}

				if(mi == match_length)
					return score;
				else
					advanceBuffer<SourceString, MatchCharT>(source, buffer, buffer_end, source_index, window_size, mi -1);
			}
			return -1;
		}

		template<class SourceString, class MatchCharT>
		bool fuzzySearchMatchFirst(SourceString& source, const std::basic_string<MatchCharT>& match, unsigned window_size = 0)
		{
			return fuzzySearchRL<SourceString, MatchCharT>(source, match, window_size) >= 0 ? true : false;
		}
	}
}
