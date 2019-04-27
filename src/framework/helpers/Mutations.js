export const MUTATIONS = Symbol('__mutations__');

export default class Mutations {
  constructor(host, mutations = {}) {
    const {
      observedAttributes
    } = host.constructor;

    const {
      attributes = false,
      attributeFilter = observedAttributes,
      attributeOldValue,

      characterData,
      characterDataOldValue,

      childList = false,

      subtree = false
    } = mutations;

    const config = {
      subtree
    };

    if (typeof attributes === 'function') {
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
        switch (mutation.type) {
          case 'attributes':
            attributes.call(host, mutation, host);
            break;
          case 'characterData':
            characterData.call(host, mutation, host);
            break;
          case 'childList':
            childList.call(host, mutation, host);
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
