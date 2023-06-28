import { MODULE_NAME } from '../consts.mjs';

const fatesFavored = 'fatesFavored';

/**
 * @param {() => number} wrapped
 * @this any ItemChange
 */
function patchChangeValue(wrapped) {
    const parent = this.parent?.parentActor;
    const value = this.data.value;
    return this.modifier === 'luck' && parent?.itemFlags?.boolean?.[fatesFavored]
        ? isNaN(+value) ? `${value} + 1` : (+value + 1)
        : value;
}

Hooks.once('setup', () => libWrapper.register(MODULE_NAME, 'pf1.components.ItemChange.prototype.value', patchChangeValue, libWrapper.OVERRIDE));
