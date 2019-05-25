const GLOBAL_CHANNEL = '__GLOBAL_CHANNEL__';

const CACHE_DATA = Symbol('__cache_data__');
const INITIAL_CACHE = Symbol('__initial_cache__');

class Cache {
  constructor(data = {}) {
    this[CACHE_DATA] = this[INITIAL_CACHE] = data;
  }

  get(key, defaultValue) {
    let {
      [CACHE_DATA]: { [key]: cache }
    } = this;

    if (!cache) {
      if (typeof defaultValue === 'function') {
        this.set(key, cache = defaultValue());
      } else {
        this.set(key, cache = defaultValue);
      }
    }

    return cache;
  }

  set(key, value) {
    this[CACHE_DATA][key] = value;
  }

  reset() {
    this[CACHE_DATA] = this[INITIAL_CACHE];
  }

  clear() {
    this[CACHE_DATA] = {};
  }

  *[Symbol.iterable]() {
    yield* Object.entries(this[CACHE_DATA]);
  }
}

const SUBSCRIPTIONS = Symbol('__subscriptions__');
class Channel {
  constructor() {
    this[SUBSCRIPTIONS] = new Cache();
  }

  subscribe(task, callback) {
    const subs = this[SUBSCRIPTIONS].get(task, []);
    subs.push(callback);
  }

  publish(task, data) {
    const subs = this[SUBSCRIPTIONS].get(task) || [];

    for (const callback of subs) {
      callback(data);
    }
  }
}

const CHANNEL_CACHE = new Cache({
  [GLOBAL_CHANNEL]: new Channel()
});

export function channel(name = GLOBAL_CHANNEL) {
  return CHANNEL_CACHE.get(name, () => new Channel());
}

export function subscribe(parcel) {
  const {
    channel:name = GLOBAL_CHANNEL,
    task,
    callback
  } = parcel;

  const subscriber = channel(name);
  subscriber.subscribe(task, callback);
}

export function publish(parcel) {
  const {
    channel:name = GLOBAL_CHANNEL,
    task,
    data
  } = parcel;

  const publisher = channel(name);
  publisher.publish(task, data);
}

