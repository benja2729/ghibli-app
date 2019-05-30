import Cache from './Cache.js';

export function applyMixins(SuperClass, ...Mixins) {
  for (const MixinClass of Mixins) {
    MixinClass.apply(SuperClass);
  }
}

const DESCRIPTOR_CACHE = Cache(MixinClass => {
  const Parent = Object.getPrototypeOf(MixinClass);
  const mixinDescs = Object.getOwnPropertyDescriptors(MixinClass.prototype);

  if (Parent !== Mixin) {
    const parentDescs = DESCRIPTOR_CACHE.get(Parent);

    for (const [key, desc] of Object.entries(parentDescs)) {
      if (!mixinDescs[key]) {
        mixinDescs[key] = desc;
      }
    }
  }

  delete mixinDescs.constructor;
  return mixinDescs;
});

export default class Mixin {
	static get descriptors() {
		return DESCRIPTOR_CACHE.get(this);
	}

  static applyToClass(SuperClass) {
    const { prototype: proto } = SuperClass;
		const { descriptors } = this;

    for (const [key, desc] of Object.entries(descriptors)) {
      if (proto.hasOwnProperty(key)) {
        throw new Error(
          `[Mixin] Cannot overwrite '${key}' from ${this} onto ${SuperClass}`
        );
      } else {
        Object.defineProperty(proto, key, desc);
      }
    }
	}

  constructor() {
    throw new Error('[Mixin] You cannot create an instance of a Mixin');
  }
}
