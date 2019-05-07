import { Transform, registerTransform } from '../framework/helpers/transforms.js';
import { Film } from '../helpers/Store.js';
import store from '../store.js';

export default class FilmTransform extends Transform {
  static get typeFor() { return 'film'; }
  static detect(valud) { return value instanceof Film; }

  get films() { return store.films; }
  
  extract(id) {
    return this.films.find(film => film.id === id);
  }

  serialize(film) {
    return film.id;
  }
}

registerTransform(FilmTransform);

