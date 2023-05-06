Hooks.once('init', () => console.log('ckl roll bonuses loaded'));

import './skills/init.mjs';
import './saves/init.mjs';
import './spells/init.mjs';

import { init } from './util/item-hints.mjs';
init();
