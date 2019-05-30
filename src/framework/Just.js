import defineCustomElement from './helpers/defineCustomElement.js';
import { registerPod } from './helpers/AssetRegistry.js';

export { defineCustomElement, registerPod };
export { default as Mixin } from './helpers/Mixin.js';
export { default as Plugin } from './helpers/Plugin.js';

export default function registerCustomElement(
  meta,
  CustomElement,
  options = {}
) {
  const pod = registerPod(meta, options.pod);
  delete options.pod;
  defineCustomElement(pod.tag, CustomElement, options);
}
