import { CoreElement, registerComponent } from '../framework/Just.js';
import { transform } from '../framework/helpers/transforms.js';

export default class GhibliFilmDetails extends CoreElement {
  onConnect() {
    // this.render();
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

GhibliFilmDetails.attributes = {
  film: {
    bind: true,
    transform: transform('film'),
    onChange(host) {
      host.clearSection();
      host.render();
    }
  }
};

registerComponent(import.meta, GhibliFilmDetails, {
  extends: 'section',
  styles: true,
  template: true
});
