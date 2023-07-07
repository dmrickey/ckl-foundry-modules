import { localHooks } from './util/hooks.mjs';
import { MODULE_NAME } from './consts.mjs';

import './util/item-hints.mjs';
import './bonuses.mjs';

/**
 * @param {() => any} wrapped
 * @this {ChatAttack}
*/
function setAttackNotesHTMLWrapper(wrapped) {
    Hooks.call(localHooks.chatAttackAttackNotes, this);
    return wrapped();
}

/**
 * @param {() => any} wrapped
 * @this {ChatAttack}
 */
function setEffectNotesHTMLWrapper(wrapped) {
    Hooks.call(localHooks.chatAttackEffectNotes, this);
    return wrapped();
}

/**
 * @param {*} wrapped
 * @param {*} options
 * @this {d20Roll}
 * @returns The result of the original method.
 */
function d20RollWrapper(wrapped, options = {}) {
    Hooks.call(localHooks.d20Roll, options);
    return wrapped.call(this, options);
}

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
 * @param {() => any} wrapped
 * @param {object} e - The attack dialog's JQuery form data or FormData object
 * @this ActionUse
 */
function actionUseAlterRollData(wrapped, e) {
    wrapped();
    Hooks.call(localHooks.actionUseAlterRollData, this);
}

/**
 * @param {(actionId: string) => any} wrapped
 * @param {string} actionId
 * @this {ItemPF}
 */
function itemGetAttackSources(wrapped, actionId) {
    const sources = wrapped(actionId);
    Hooks.call(localHooks.itemGetAttackSources, this, sources);
    return sources;
}

Hooks.once('setup', () => {
    libWrapper.register(MODULE_NAME, 'pf1.actionUse.ActionUse.prototype.alterRollData', actionUseAlterRollData, libWrapper.WRAPPER)
    libWrapper.register(MODULE_NAME, 'pf1.actionUse.ChatAttack.prototype.setAttackNotesHTML', setAttackNotesHTMLWrapper, libWrapper.WRAPPER);
    libWrapper.register(MODULE_NAME, 'pf1.actionUse.ChatAttack.prototype.setEffectNotesHTML', setEffectNotesHTMLWrapper, libWrapper.WRAPPER);
    libWrapper.register(MODULE_NAME, 'pf1.dice.d20Roll', d20RollWrapper, libWrapper.WRAPPER);
    libWrapper.register(MODULE_NAME, 'pf1.documents.item.ItemPF.prototype.use', itemUseWrapper, libWrapper.WRAPPER);
    libWrapper.register(MODULE_NAME, 'pf1.documents.item.ItemPF.prototype.getAttackSources', itemGetAttackSources, libWrapper.WRAPPER);
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
