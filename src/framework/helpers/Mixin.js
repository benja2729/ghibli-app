const DEFINITIONS = Symbol('__mixin_definitions__');
const IDENTITY = Symbol('__mixin_identity__');
const REGISTRY = Symbol('__mixin_registry__');

class MixinRegistry extends WeakMap {
  static get [Symbol.species]() {
    return this;
  }

  static isComposedClass(ComposedClass) {
    return Boolean(
      ComposedClass && ComposedClass[DEFINITIONS] instanceof WeakSet
    );
  }

  constructor(identity) {
    super();

    Object.defineProperty(this, 'identity', {
      value: identity
    });
  }

  get(SuperClass) {
    if (!this.has(SuperClass)) {
      const { identity } = this;
      const ComposedClass = identity(SuperClass);
      let { [DEFINITIONS]: identitySet } = ComposedClass;

      if (!identitySet) {
        identitySet = new WeakSet(SuperClass[DEFINITIONS] || null);

        Object.defineProperty(ComposedClass, DEFINITIONS, {
          value: identitySet
        });
      }

      identitySet.add(identity);
      this.set(SuperClass, ComposedClass);
    }

    return super.get(SuperClass);
  }

  set(SuperClass, ComposedClass) {
    if (this.hasIdentity(ComposedClass)) {
      super.set(SuperClass, ComposedClass);
    }
  }

  hasIdentity(SuperClass) {
    if (!MixinRegistry.isComposedClass(SuperClass)) {
      return false;
    }

    const { identity } = this;
    const { [DEFINITIONS]: identitySet } = SuperClass;
    return identitySet.has(identity);
  }

  detect(SuperClass) {
    let Parent = SuperClass;

    while (Parent) {
      if (this.hasIdentity(Parent)) {
        return true;
      }

      Parent = Object.getPrototypeOf(Parent);
    }

    return false;
  }
}

class MixinInterface {
  constructor(SuperClass) {
    this.SuperClass = SuperClass;
  }

  with(...mixins) {
    return mixins.reduce(
      (ComposedClass, mixin) => mixin(ComposedClass),
      this.SuperClass
    );
  }
}

export function mix(SuperClass) {
  return new MixinInterface(SuperClass);
}

export function getMixinMetadata(mixin) {
  const { [REGISTRY]: registry, [IDENTITY]: identity } = mixin;
  return { registry, identity };
}

export default function Mixin(identity) {
  const registry = new MixinRegistry(identity);

  function mixin(SuperClass) {
    if (registry.detect(SuperClass)) {
      return SuperClass;
    }

    return registry.get(SuperClass);
  }

  const detectInstance = ({ constructor }) => registry.detect(constructor);
  Object.defineProperties(mixin, {
    [Symbol.hasInstance]: {
      value: detectInstance
    },
    [IDENTITY]: {
      value: identity
    },
    [REGISTRY]: {
      value: registry
    },
    detect: {
      value: SuperClass => registry.detect(SuperClass)
    },
    detectInstance: {
      value: detectInstance
    }
  });

  return mixin;
}
