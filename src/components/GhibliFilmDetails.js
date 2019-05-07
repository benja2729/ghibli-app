import CustomElement from '../framework/CustomElement.js';
import { transform } from '../framework/helpers/transforms.js';

const filmTransform = transform('film');

export default class GhibliFilmDetails extends CustomElement {
  static get observedAttributes() {
    return ['film'];
  }

  onConnect() {
    this.render();
  }

  get template() {
    return this.querySelector('template');
  }

  get film() {
    return this.getState('film');
  }

  set film(film) {
    this.setState('film', film);
  }

  filmChanged(filmId) {
    this.film = filmTransform.extract(filmId);
    this.clearSection();
    this.render();
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

