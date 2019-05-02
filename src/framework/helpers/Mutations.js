import { attr2prop } from './utils.js';

export const MUTATIONS = Symbol('__mutations__');

function attributeChanged(mutation) {
  const { attributeName, target: host, oldValue } = mutation;
  const newValue = host.getAttribute(attributeName);

  if (oldValue !== newValue) {
    const changeFn = host[`${attr2prop(attributeName)}Changed`];

    if (typeof changeFn === 'function') {
      changeFn.call(host, newValue, oldValue);
    }
  }
}

export default class Mutations {
  constructor(host, mutations = {}) {
    const {
      attributes = true,
      attributeFilter,
      attributeOldValue = true,

      characterData,
      characterDataOldValue,

      childList = false,

      subtree = false
    } = mutations;

    const config = {
      subtree
    };

    if (attributes) {
      Object.assign(config, {
        attributes: true,
        attributeOldValue,
        attributeFilter
      });
    }

    if (typeof characterData === 'function') {
      Object.assign(config, {
        characterData: true,
        characterDataOldValue
      });
    }

    if (typeof childList === 'function') {
      config.childList = true;
    }

    function handleMutation(mutationList) {
      for (const mutation of mutationList) {
        const { target, type } = mutation;
        const params = [host, mutation, target];

        switch (type) {
          case 'attributes':
            attributeChanged(mutation);

            if (typeof attributes === 'function') {
              attributes.call(...params);
            }
            break;
          case 'characterData':
            characterData.call(...params);
            break;
          case 'childList':
            childList.call(...params);
            break;
        }
      }
    }

    this.observer = new MutationObserver(handleMutation);
    this.observer.observe(host, config);
  }

  destroy() {
    this.observer.disconnect();
  }
}
