import CustomElement from '../framework/CustomElement.js';
import { transform } from '../framework/helpers/transforms.js';

export default class GhibliFilmDetails extends CustomElement {
  static get attributes() {
    return {
      film: {
        bind: true,
        transform: transform('film'),
        onChange(host) {
          host.clearSection();
          host.render();
        }
      }
    };
  }

  onConnect() {
    this.render();
  }

  get template() {
    return this.querySelector('template');
  }

  clearSection() {
    const { template } = this;

    while (this.lastElementChild) {
      if (this.lastElementChild === template) break;
      this.lastElementChild.remove();
    }
  }

  render() {
    const { template, film } = this;

    if (film) {
      const details = template.render(film);
      this.append(...details.children);
    }
  }
}

GhibliFilmDetails.registerAs('ghibli-film-details', {
  extends: 'section'
});
