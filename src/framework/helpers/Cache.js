
export default function Cache(getUnset) {
	class CacheMap extends Map {
		get(key) {
			if (this.has(key)) {
				return this.get(key);
			}

			const value = getUnset(key);
			this.set(key, value);
			return value;
		}
	}

	return new CacheMap;
}
