// Returns a list of inserts and deletions 
// that need to occur to allow the CRDT to 
// be correctly updated.
// Using near Verbatim Myers Difference Algorithm
// With O((N+M)D) complexity (Space and Time)


export function get_text_diffs(prev, next) {

    let D = 0;
    let M = prev.length;
    let N = next.length;

    const MAX = Math.max(0, M + N);

    let V = new Array(MAX * 2).fill(0);

    const VS = [];

    outer: while (D < MAX) {


        for (let k = -D; k <= D; k += 2) {
            let x = -1;
            if (k == -D || (k != D && V[MAX + (k - 1)] < V[MAX + (k + 1)])) {
                x = V[MAX + (k + 1)];
            } else {
                x = V[MAX + (k - 1)] + 1;
            }

            let y = x - k;

            while (x < M && y < N && prev[x] == next[y]) {
                x++;
                y++;
            }

            V[MAX + k] = x;

            if (x >= M && y >= N) {

                VS.push(V.slice());

                break outer;
            }
        }

        VS.push(V.slice());

        D++;
    }
    let x = M, y = N;
    let k = x - y;

    if (D == MAX)
        D--;

    let transitions = [[M, N]];

    for (let d = D; d >= 0; d--) {

        let V = VS[d];

        let end_point_x = V[MAX + k];
        let end_point_y = end_point_x - k;

        transitions.unshift([end_point_x, end_point_y]);

        let kp = 0;

        if (k == -d || (k != d && V[MAX + (k - 1)] < V[MAX + (k + 1)])) {
            kp = k + 1;
        } else {
            kp = k - 1;
        }

        k = kp;
    }

    transitions.unshift([0, 0]);

    let commands = [];

    let px = 0, py = 0;

    for (const [x, y] of transitions) {
        let pd = px - py;
        let d = x - y;
        let dd = d - pd;

        if (dd < 0) {
            commands.push([1, py, next[py]]);
        } else if (dd > 0) {
            commands.push([0, py, prev[px]]);
        }

        px = x;
        py = y;
    }

    return commands;
}
;

export function get_hierarchy_list(tag_get_tags) {

    const pairs = [];

    const tags = tag_get_tags();

    if (tags.length > 1) {

        for (let i = 0; i < tags.length; i += 2) {
            pairs.push([tags[i + 0], tags[i + 1]]);
        }
        //Find hierarchal tags
        const hierarchal_tags = pairs.filter(t => t[0].match(/.*[\\\/].*/g));

        // Split tags into hierarchal tree with each 
        // node representing a single tag (or no tag if a tag does not 
        // exists that has as it's final element the corresponding node 
        // name)
        const hierarchies = [];

        for (const [tag_list, id] of hierarchal_tags) {

            const bucket_names = tag_list.split(/[\\\/]/);
            const bucket_name = bucket_names.pop();

            if (bucket_names[0] == "")
                bucket_names.shift();

            let curr_buckets = hierarchies;

            for (const bucket_name of bucket_names) {

                let FOUND_BUCKET = false;

                for (let bucket of curr_buckets) {
                    if (bucket.name == bucket_name) {
                        FOUND_BUCKET = true;
                        curr_buckets = bucket.buckets;
                        break;
                    }
                }

                if (!FOUND_BUCKET) {
                    let new_curr_buckets = [];
                    curr_buckets.push({
                        name: bucket_name,
                        id: -1,
                        buckets: new_curr_buckets
                    });
                    curr_buckets = new_curr_buckets;
                }
            }

            let FOUND_BUCKET = false;

            for (let bucket of curr_buckets) {
                if (bucket.name == bucket_name) {
                    bucket.id = id;
                    FOUND_BUCKET = true;
                    break;
                }
            }

            if (!FOUND_BUCKET)
                curr_buckets.push({
                    name: bucket_name,
                    id: id,
                    tag: tag_list,
                    buckets: []
                });


        }

        return hierarchies;
    }

    return [];
}
