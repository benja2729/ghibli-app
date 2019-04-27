export default class Fragment extends HTMLElement {
  static create(childConfig) {
    const fragment = document.createElement('element-fragment');
    return fragment.configure(childConfig);
  }

  constructor() {
    super();

    if (this.constructor !== Fragment) {
      throw new Error('Cannot extend class type Fragment');
    }
  }

  connectedCallback() {
    this.remove();
    throw new Error('Cannot connect "element-fragment" to DOM');
  }

  get fragment() {
    return document.createElement('element-fragment');
  }

  configure(childConfig) {
    if (typeof childConfig !== 'object') {
      return this;
    }

    const configEntries = Object.entries(childConfig);

    for (const [name, callback] of configEntries) {
      this.add(name, callback);
    }

    return this;
  }

  create(elmName, callback) {
    let elm;
    const { fragment } = this;
    const [name, is] = elmName.split(':');
    if (is) {
      elm = document.createElement(name, { is });
    } else {
      elm = document.createElement(name);
    }

    switch (typeof callback) {
      case 'function':
        callback.call(fragment, elm, fragment);
        break;
      case 'object':
        fragment.configure(callback);
        break;
      case 'string':
        elm.textContent = callback;
        break;
    }

    fragment.attachTo(elm);
    return elm;
  }

  add(name, callback) {
    const elm = this.create(name, callback);
    this.appendChild(elm);
    return elm;
  }

  attachTo(element) {
    element.append(...this.children);
  }
}

customElements.define('element-fragment', Fragment);

