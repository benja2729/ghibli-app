import defineCustomElement from './helpers/defineCustomElement.js';
import * as ASSET_REGISTRY from './helpers/AssetRegistry.js';
import ShadowPlugin from './plugins/ShadowPlugin.js';

export { defineCustomElement, ASSET_REGISTRY };
export { default as Mixin } from './helpers/Mixin.js';
export { default as Plugin } from './helpers/Plugin.js';

const { definePod, setPod } = ASSET_REGISTRY;
const { SIGNATURE } = ShadowPlugin;
const SHADOW_SIGNATURE = SIGNATURE();

export async function registerComponent(meta, options = {}) {
  const { plugins = [], template } = options;
  const pod = definePod(meta, options);
  const [{ default: CustomElement }] = await setPod(pod.tag, pod);

  if (template) {
    options.plugins = [SHADOW_SIGNATURE, ...plugins];
  }

  defineCustomElement(pod.tag, CustomElement, options);
}
