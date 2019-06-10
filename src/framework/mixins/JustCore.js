import Mixin, { mix } from '../helpers/Mixin.js';
import Stateful from './Stateful.js';
import Actionable from './Actionable.js';
import { assertHTMLElement } from '../helpers/utils.js';

export default Mixin(HTMLClass => {
  assertHTMLElement(HTMLClass, `[JustCore] Expected instance of HTMLElement`);

  class JustCore extends mix(HTMLClass).with(Actionable, Stateful) {}

  return JustCore;
});
