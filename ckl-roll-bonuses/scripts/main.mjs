import { localHooks } from './util/hooks.mjs';
import { MODULE_NAME } from './consts.mjs';

import './skills/init.mjs';
import './saves/init.mjs';
import './spells/init.mjs';
import './fortune/init.mjs';
import './util/item-hints.mjs';

function itemUseWrapper(wrapped, options = {}) {
    Hooks.call(localHooks.itemUse, this, options);
    return wrapped.call(this, options);
}

Hooks.once('setup', () => {
    /* global libWrapper */
    libWrapper.register(MODULE_NAME, 'pf1.documents.item.ItemPF.prototype.use', itemUseWrapper, libWrapper.WRAPPER);
});

Hooks.once('init', () => console.log('ckl roll bonuses loaded'));
