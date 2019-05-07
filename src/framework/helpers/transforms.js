
const TRANSFORMS = {};
const CUSTOM_TRANSFORMS = {};
const INVALID_TRANSFORM = Symbol.for('INVALID_TRANSFORM');

/**
 * To define a custom Transform you must override static property `typeFor`, 
 * static method `detect`, and instance methods `extract` and `serialize`.
 */
export class Transform {
  static get typeFor() {
    throw new Error(`[Transform] Must define static getter 'typeFor' as string`);
  }
  static detect(value) { return typeof value === this.typeFor }

  constructor(meta = {} ) {
    this.meta = meta;
  }

  get invalid() {
    const { meta: { allowInvalid } } = this;
    return allowInvalid ? INVALID_TRANSFORM : null;
  }

  extract(value) { return value; }
  serialize(value) { return `${value}`; }
}

const isNone = value => value === null || value === undefined;

class StringTransform extends Transform {
  static get typeFor() { return 'string' }

  parseString(value) {
    if (isNone(value)) {
      return this.invalid;
    }

    return `${value}`;
  }

  extract(value) { return this.parseString(value); }
  serialize(value) { return this.parseString(value); }
};

class NumberTransform extends Transform {
  static get typeFor() { return 'number' }

  parseNumber(value) {
    if (value === '' || isNone(value)) {
      return this.invalid;
    }

    return parseFloat(value, 10);
  }

  extract(value) { return this.parseNumber(value); }
  serialize(value) { return this.parseNumber(value); }
};

class BooleanTransform extends Transform {
  static get typeFor() { return 'boolean'; }

  extract(value) {
    if (value === '' || isNone(value)) {
      return this.invalid;
    }

    switch (typeof value) {
      case 'boolean': return value;
      case 'string': return /^(true|t|1)$/i.test(value);
      case 'number': return value === 1;
      default: return false;
    }
  }

  serialize(value) {
    if (value === '' || isNone(value)) {
      return this.invalid;
    }
    
    return Boolean(value);
  }
}

class DateTransform extends Transform {
  static get typeFor() { return 'date'; }
  static detect(value) { return value instanceof Date; }

  extract(value) {
    if (isNone(value)) {
      return value;
    }

    switch (typeof value) {
      case 'string': return new Date(value);
      case 'number': return new Date(value);
    }

    return this.invalid;
  }

  serialize(value) {
    if (this.constructor.detect(value) && !isNaN(value)) {
      return value.toISOString();
    }

    return this.invalid;
  }
}

TRANSFORMS['string'] = StringTransform;
TRANSFORMS['number'] = NumberTransform;
TRANSFORMS['boolean'] = BooleanTransform;
TRANSFORMS['date'] = DateTransform;

export function registerTransform(transform) {
  const { typeFor } = transform;

  if (!(transform.prototype instanceof Transform)) {
    throw new TypeError(`[registerTransform] Can only register a child class of Transform`);
  }

  CUSTOM_TRANSFORMS[typeFor] = transform;
  return transform;
}

const DETECT_MAP = new WeakMap();
const detect = (map, value) => Object.values(map).find(transform => transform.detect(value));
export function detectTransform(value) {
  if (DETECT_MAP.has(value)) {
    return DETECT_MAP.get(value);
  }

  const transform = detect(CUSTOM_TRANSFORMS, value) || detect(TRANSFORMS, value);
  DETECT_MAP.set(value, transform);
  return transform;
}

export function transform(prop, meta) {
  const transform =  CUSTOM_TRANSFORMS[prop] || TRANSFORMS[prop];

  if (!transform) {
    throw new Error(`[transforms] No transform for type '${prop}'`);
  }

  return new transform(meta);
}

