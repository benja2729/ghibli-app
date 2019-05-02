export function dispatchAction(host, name, detail, options = {}) {
  const action = new CustomEvent(name, {
    bubbles: true,
    composed: true,
    cancelable: true,
    ...options,
    detail
  });
  host.dispatchEvent(action);
}

export function attr2prop(attr) {
  return attr.replace(/-(\w)/g, (_, char) => {
    return char.toUpperCase();
  });
}

export function attachBoundAttributes(host, attrs = []) {
  const { prototype: proto } = host.constructor;
  const enumerable = false;
  const configurable = true;

  for (const attr of attrs) {
    function get() {
      const value = host.getAttribute(attr);

      switch (value) {
        case undefined:
          return false;
        case '':
          return true;
        default:
          return value;
      }
    }

    function set(value) {
      switch (value) {
        case true:
          host.setAttribute(attr, '');
          break;
        case false:
          host.removeAttribute(attr);
          break;
        default:
          host.setAttribute(attr, value);
      }
    }

    const prop = attr2prop(attr);
    let protoDesc = Object.getOwnPropertyDescriptor(proto, prop);

    if (protoDesc) {
      const { get: pGet, set: pSet } = protoDesc;

      // Abort if there's already a full implementation in class definition
      if (pGet && pSet) {
        continue;
      }

      // Allow selective override of accessors
      const desc = {
        ...protoDesc,
        get: pGet || get,
        set: pSet || set
      };

      Object.defineProperty(host, prop, desc);
    } else {
      // Add generic accessors
      Object.defineProperty(host, prop, {
        enumerable,
        configurable,
        get,
        set
      });
    }
  }
}
