// https://www.d20pfsrd.com/feats/combat-feats/martial-focus-combat/
// +1 damage to chosen weapon group with proficient weapon

import { intersects } from "../util/array-intersects.mjs";
import { KeyedDFlagHelper } from "../util/flag-helpers.mjs";
import { registerItemHint } from "../util/item-hints.mjs";
import { localize } from "../util/localize.mjs";
import { registerSetting } from "../util/settings.mjs";
import { truthiness } from "../util/truthiness.mjs";

const key = 'martial-focus';
const id = 'W1eDSqiwljxDe0zl';

registerSetting({ key: key });

class Settings {
    static get martialFocus() { return Settings.#getSetting(key); }
    // @ts-ignore
    static #getSetting(/** @type {string} */key) { return game.settings.get(MODULE_NAME, key).toLowerCase(); }
}

// register hint on feat
registerItemHint((hintcls, _actor, item, _data) => {
    const current = item.getItemDictionaryFlag(key);
    if (current) {
        return hintcls.create(`${current}`, [], {});
    }
});

// register hint on focused weapon/attack
registerItemHint((hintcls, actor, item, _data) => {
    if (!(item instanceof pf1.documents.item.ItemEquipmentPF || item instanceof pf1.documents.item.ItemAttackPF)) {
        return;
    }

    if (item instanceof pf1.documents.item.ItemEquipmentPF && !item.system.proficient) {
        return;
    }

    const weaponGroups = [...item.system.weaponGroups.value, ...item.system.weaponGroups.custom.split(';')].filter(truthiness);
    const focuses = new KeyedDFlagHelper(actor.itemFlags.dictionary, key).valuesForFlag(key);

    const isFocused = intersects(weaponGroups, focuses);

    if (isFocused) {
        return hintcls.create(localize(key), [], {});
    }
});

// can't really do this because I don't know which weapon is being attacked with -- this will have to part of attacking itself
// /**
//  * @param {ActorPF} actor
//  * @param {ItemChange[]} tempChanges
//  */
// function handleArmorFocusChange(actor, tempChanges) {
//     const focuses = new KeyedDFlagHelper(actor.itemFlags.dictionary, key).valuesForFlag(key);
//     if (!focuses.length) return;

//     const item =
//         actor.items.find(
//             /** @returns {item is ItemEquipmentPF | ItemAttackPF}} */
//             (item) => ((item instanceof pf1.documents.item.ItemEquipmentPF && item.system.proficient) || item instanceof pf1.documents.item.ItemAttackPF));
//     if (!item) return;
//     const weaponGroups = [...item.system.weaponGroups.value, ...item.system.weaponGroups.custom.split(';')].filter(truthiness);
//     if (!weaponGroups?.length) return;

//     const isFocused = intersects(focuses, weaponGroups);
//     if (!isFocused) return;

//     if (isFocused) {
//         tempChanges.push(
//             new pf1.components.ItemChange({
//                 flavor: localize(key),
//                 formula: -1,
//                 modifier: "untypedPerm",
//                 subTarget: "wdamage",
//             })
//         );
//     }
// }
// Hooks.on('pf1AddDefaultChanges', handleArmorFocusChange);
