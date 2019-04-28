export default class CustomTemplate extends HTMLTemplateElement {
  get hook() {
    return this.getAttribute('hook') || 'data-strategy';
  }

  set hook(hook) {
    this.setAttribute('hook', hook);
  }

  get root() {
    return this.content.cloneNode(true);
  }

  render(context) {
    const { root } = this;
    const segments = this.gatherSegments(root);
    this.applySegments(segments, context);
    return root;
  }

  gatherSegments(root) {
    return root.querySelectorAll(`[${this.hook}]`);
  }

  applySegments(segments, context) {
    const { hook } = this;

    for (const segment of segments) {
      const strategy = segment.getAttribute(hook);
      const {
        [`${strategy}Strategy`]: strategyFn
      } = this;
      const params = [this, segment, context, this.parentElement];
      segment.removeAttribute(hook);

      if (typeof strategyFn === 'function') {
        strategyFn.call(...params);
      } else {
        this.unknownStrategy(...params);
      }
    }
  }

  unknownStrategy(segment) {
    const attr = segment.getAttribute(this.hook);
    throw new Error(
      `[CustomTemplate] unknown strategy for '${segment.tagName}' with '${attr}'`
    );
  }
}

