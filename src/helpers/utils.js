const ADAPTER_PERSIST = Symbol('__adapter_persist__');

class Connection {
  constructor(origin) {
    this.origin = origin;
  }

  get persist() {
    return this[ADAPTER_PERSIST];
  }

  buildRequest(path, options) {

  }

  get(path, configureRequest) {

  }

  /*
  put() {}
  post() {}
  delete() {}
  */
}

class Adapter {
  static connect(origin) {
    return new this(origin);
  }

  static persist(connection) {
    connection[ADAPTER_PERSIST] = true;
  }
}

class UrlCache {
  getKey(url) {
    if (typeof url === 'string') {
      return url;
    } else if (url instanceof URL) {
      return url.href;
    } else {
      throw new TypeError('[UrlCache] expected String or URL');
    }
  }

  has(url) {
    const key = this.getKey(url);
    return localStorage.hasOwnProperty(key);
  }

  get(url) {
    const key = this.getKey(url);
    return localStorage.getItem(key);
  }

  getJSON(url) {
    return JSON.parse(this.get(url));
  }

  set(url, string) {
    const key = this.getKey(url);
    localStorage.setItem(key, string);
  }

  setJSON(url, json) {
    this.set(url, JSON.stringify(json));
  }
}

const URL_CACHE = new UrlCache();

export async function ajax(...args) {
  const [url] = args;

  if (!URL_CACHE.has(url)) {
    const response = await fetch(...args);

    if (response.ok) {
      const text = await response.text();
      URL_CACHE.set(url, text);
    } else {
      throw await response;
    }
  }

  return URL_CACHE.getJSON(url);
}

