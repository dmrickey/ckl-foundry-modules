import { localHooks } from './util/hooks.mjs';
import { MODULE_NAME } from './consts.mjs';

import './skills/init.mjs';
import './saves/init.mjs';
import './spells/init.mjs';
import './fortune/fortune-handler.mjs';
import './critical/critical.mjs';

import './util/item-hints.mjs';

/**
 * @param {*} wrapped - original method
 * @param {*} options - options passed to ItemPF.use
 * @this {ItemPF}
 * @returns The result of the original method.
 */
function itemUseWrapper(wrapped, options = {}) {
    Hooks.call(localHooks.itemUse, this, options);
    return wrapped.call(this, options);
}

/**
 *
 * @param {*} wrapped
 * @param {*} options
 * @this {d20Roll}
 * @returns The result of the original method.
 */
function d20RollWrapper(wrapped, options = {}) {
    Hooks.call(localHooks.d20Roll, options);
    return wrapped.call(this, options);
}

Hooks.once('setup', () => {
    libWrapper.register(MODULE_NAME, 'pf1.documents.item.ItemPF.prototype.use', itemUseWrapper, libWrapper.WRAPPER);
    libWrapper.register(MODULE_NAME, 'pf1.dice.d20Roll', d20RollWrapper, libWrapper.WRAPPER);
});


/** this block can be removed after updated for 0.83.0 */

/**
 * @param {{ call: (arg0: any, arg1: keyof Abilities, arg2: {}) => any; }} wrapped
 * @param {keyof Abilities} abilityId
 * @this {ActorPF}
 * @returns The result of the original method after modifying options.
 */
function rollAbilityTestWrapper(
    wrapped,
    abilityId,
    options = {},
) {
    Hooks.call(localHooks.rollAbilityTest, this, abilityId, options);
    return wrapped.call(this, abilityId, options);
}

/**
 * @param {{ call: (arg0: any, arg1: {}) => any; }} wrapped
 * @this {ActorPF}
 * @returns The result of the original method after modifying options.
 */
function rollCMBWrapper(wrapped, options = {}) {
    Hooks.call(localHooks.rollCMB, this, options);
    return wrapped.call(this, options);
}

/**
 * @param {{ call: (arg0: ActorPF, arg1: keyof SavingThrows, arg2: {}) => any; }} wrapped
 * @param {keyof SavingThrows} savingThrowId
 * @this {ActorPF} *
 * @returns The result of the original method after modifying options.
 */
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