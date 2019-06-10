export default function Cache(getUnset, MapLike = Map) {
  class CacheMap extends MapLike {
    get(key) {
      if (this.has(key)) {
        return super.get(key);
      }

      const value = getUnset(key);
      this.set(key, value);
      return value;
    }
  }

  return new CacheMap();
}
