const data_cache = new Map;

export function cache(object: object) {

    const key = Object.entries(object).map((k, v) => k + v.toString()).sort().join("");
    
    if (!data_cache.has(key)) {
        data_cache.set(key, object);
    }

    return data_cache.get(key);
}
