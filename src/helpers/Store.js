import { ajax } from './utils.js';

class Model {
  constructor(data = {}) {
    Object.assign(this, data);
  }
}

export class Film extends Model {}

export default class Store {
  async find(type) {
    if (type === 'films') {
      const data = await ajax('https://ghibliapi.herokuapp.com/films');
      this[type] = data.map(film => new Film(film));
    }

    return this[type];
  }
}
