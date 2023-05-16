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

function d20RollWrapper(wrapped, options = {}) {
    Hooks.call(localHooks.d20Roll, options);
    return wrapped.call(this, options);
}

Hooks.once('setup', () => {
    libWrapper.register(MODULE_NAME, 'pf1.documents.item.ItemPF.prototype.use', itemUseWrapper, libWrapper.WRAPPER);
    libWrapper.register(MODULE_NAME, 'pf1.dice.d20Roll', d20RollWrapper, libWrapper.WRAPPER);
});

/** this block can be removed after updated for 0.83.0 */

function rollAbilityTestWrapper(wrapped, abilityId, options = {}) {
    Hooks.call(localHooks.rollAbilityTest, this, abilityId, options);
    return wrapped.call(this, abilityId, options);
}
function rollCMBWrapper(wrapped, options = {}) {
    Hooks.call(localHooks.rollCMB, this, options);
    return wrapped.call(this, options);
}
function rollSavingThrowWrapper(wrapped, savingThrowId, options = {}) {
    Hooks.call(localHooks.rollSavingThrow, this, savingThrowId, options);
    return wrapped.call(this, savingThrowId, options);
}

Hooks.once('setup', () => {
    libWrapper.register(MODULE_NAME, 'pf1.documents.actor.ActorPF.prototype.rollAbilityTest', rollAbilityTestWrapper, libWrapper.WRAPPER);
    libWrapper.register(MODULE_NAME, 'pf1.documents.actor.ActorPF.prototype.rollCMB', rollCMBWrapper, libWrapper.WRAPPER);
    libWrapper.register(MODULE_NAME, 'pf1.documents.actor.ActorPF.prototype.rollSavingThrow', rollSavingThrowWrapper, libWrapper.WRAPPER);
});

/** end block */

Hooks.once('init', () => console.log('ckl roll bonuses loaded'));
