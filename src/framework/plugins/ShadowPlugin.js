import Plugin from '../helpers/Plugin.js';

export default class ShadowPlugin extends Plugin {
  onInit() {
    const {
      host,
      host: {
        constructor: { shadowMode = 'open' }
      }
    } = this;
    const template =
      host.querySelector('template[is-shadow]') ||
      document.getElementById(`${host.localName}--template`) ||
      host.constructor.template;

    if (template) {
      const root = host.attachShadow({ mode: shadowMode });

      if (template instanceof HTMLTemplateElement) {
        const { isAsync, isLoading } = template;

        if (isAsync && isLoading) {
          template.addEventListener(
            'CONTENT_LOADED',
            () => {
              this.applyTemplateElement(template);
            },
            {
              once: true,
              capture: true
            }
          );
        } else {
          this.applyTemplateElement(template);
        }
      } else if (typeof template === 'function') {
        root.innerHTML = template(host, document);
        this.setupHostExtensions();
      }
    }
  }

  applyTemplateElement(template) {
    const {
      host: { shadowRoot: root }
    } = this;

    root.append(template.content.cloneNode(true));
    this.setupHostExtensions();
  }

  setupHostExtensions() {
    const {
      host,
      host: { shadowRoot: root }
    } = this;

    host.$ = {};
    const elms = root.querySelectorAll('[id]');

    elms.forEach(({ id }) => {
      Object.defineProperty(host.$, id, {
        enumerable: true,
        get() {
          return root.getElementById(id);
        }
      });
    });

    host.invokeLifecycleHook('onAttachShadow');
  }
}

export const Shadow = ShadowPlugin.SIGNATURE;
