export default class CustomTemplate extends HTMLTemplateElement {
  get root() {
    return this.content.firstElementChild.cloneNode(true);
  }

  connectedCallback() {
    if (this.isConnected) {
      this.hook = this.getAttribute('hook') || 'data-item';
    }
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
    for (const segment of segments) {
      const [strategy, attr] = segment.getAttribute(this.hook).split(':');
      const { [attr]: value } = context;
      const {
        [`${strategy}Strategy`]: strategyFn
      } = this;

      if (typeof strategyFn === 'function') {
        strategyFn.call(this, segment, value);
      } else {
        this.unknownStrategy(segment, value);
      }
    }
  }

  textStrategy(segment, value) {
    segment.textContent = value;
  }

  unknownStrategy(segment) {
    const attr = segment.getAttribute(this.hook);
    throw new Error(
      `[CustomTemplate] unknown strategy for ${segment.tagName} with ${attr}`
    );
  }
}

