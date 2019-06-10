import * as ASSET_REGISTRY from './helpers/AssetRegistry.js';
import { mix } from './helpers/Mixin.js';
import Shadow from './mixins/Shadow.js';
import JustCore from './mixins/JustCore.js';

export { ASSET_REGISTRY, JustCore as JustCoreMixin };
export { default as Plugin } from './helpers/Plugin.js';

export class CoreElement extends mix(HTMLElement).with(JustCore, Shadow) {}
export function defineCustomElement(name, HTMLClass, options = {}) {
  if (!JustCore.detect(HTMLClass)) {
    throw new TypeError(
      `[defineCustomElement] Class definition for '${name}' does not implement JustCore`
    );
  }

  customElements.define(name, HTMLClass, options);
}

export async function registerComponent(meta, CustomElement, options = {}) {
  const { extends: extendsOption } = options;
  const { tag } = await ASSET_REGISTRY.registerPod(meta, options);
  const params = [tag, CustomElement];

  if (typeof extendsOption === 'string') {
    params.push({ extends: extendsOption });
  }

  defineCustomElement(...params);
}
