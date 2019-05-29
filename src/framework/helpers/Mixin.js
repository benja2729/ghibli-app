import Cache from './Cache.js';

const DESCRIPTOR_CACHE = Cache(MixinClass => {
  let parent = MixinClass;
  const protoDescs = {};

  while (parent !== Mixin) {
    const parentDescs = Object.getOwnPropertyDescriptors(parent.prototype);

    for (const [key, desc] of Object.entries(parentDescs)) {
      if (!protoDescs[key]) {
        protoDescs[key] = desc;
      }
    }

    parent = Object.getPrototypeOf(parent);
  }

  delete protoDescs.constructor;
  return protoDescs;
});

export default class Mixin {
  static apply(SuperClass) {
    const { prototype: proto } = SuperClass;
    const mixinDescs = DESCRIPTOR_CACHE.get(this);

    for (const [key, desc] of Object.entries(mixinDescs)) {
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
