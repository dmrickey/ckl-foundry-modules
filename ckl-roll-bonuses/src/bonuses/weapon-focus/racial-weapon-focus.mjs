import { MODULE_NAME } from "../../consts.mjs";
import { addNodeToRollBonus } from "../../roll-bonus-on-actor-sheet.mjs";
import { KeyedDFlagHelper, getDocDFlags } from "../../util/flag-helpers.mjs";
import { registerItemHint } from "../../util/item-hints.mjs";
import { localize } from "../../util/localize.mjs";
import { registerSetting } from "../../util/settings.mjs";
import { uniqueArray } from "../../util/unique-array.mjs";
import { gnomeWeaponFocusId, racialWeaponFocusKey, weaponFocusKey } from "./ids.mjs";

const gnomishKey = 'gnomish';

registerSetting({ key: gnomishKey });

class Settings {
    static get gnomish() { return Settings.#getSetting(gnomishKey); }
    // @ts-ignore
    static #getSetting(/** @type {string} */key) { return game.settings.get(MODULE_NAME, key).toLowerCase(); }
}

// register hint on item with focus
registerItemHint((hintcls, _actor, item, _data) => {
    const current = getDocDFlags(item, racialWeaponFocusKey)[0];
    if (!current) {
        return;
    }

    const label = `${current}`;

    const hint = hintcls.create(label, [], {});
    return hint;
});

// register hint on focused weapon/attack
registerItemHint((hintcls, actor, item, _data) => {
    if (item.type !== 'attack' && item.type !== 'weapon') return;

    const tags = item.system.tags;

    const dFlags = actor.itemFlags.dictionary;
    const helper = new KeyedDFlagHelper(dFlags, racialWeaponFocusKey);

    let label;
    if (tags.find(tag => helper.valuesForFlag(racialWeaponFocusKey).includes(tag))) {
        label = localize(weaponFocusKey);
    }

    if (label) {
        return hintcls.create(label, [], {});
    }
});

/**
 * Add Weapon Focus to tooltip
 * @param {(actionId: string) => any} wrapped
 * @param {string} actionId
 * @this {ItemPF}
 */
function getAttackSources(wrapped, actionId) {
    const sources = wrapped(actionId);

    const actor = this.actor;
    if (!actor) return;

    const tags = this.system.tags;

    const dFlags = actor.itemFlags.dictionary;
    const helper = new KeyedDFlagHelper(dFlags, racialWeaponFocusKey);

    const value = tags.find(tag => helper.valuesForFlag(racialWeaponFocusKey).includes(tag))
        ? 1
        : 0;

    if (value) {
        sources.push({ value, name: localize(weaponFocusKey), modifier: -100 });
        return sources.sort((/** @type {{ sort: number; }} */ a, /** @type {{ sort: number; }} */ b) => b.sort - a.sort);
    }

    return sources;
}
Hooks.once('setup', () => libWrapper.register(MODULE_NAME, 'pf1.documents.item.ItemPF.prototype.getAttackSources', getAttackSources, libWrapper.WRAPPER));

/**
 * @type {Handlebars.TemplateDelegate}
 */
let focusSelectorTemplate;
Hooks.once(
    'setup',
    async () => focusSelectorTemplate = await getTemplate(`modules/${MODULE_NAME}/hbs/racial-weapon-focus-selector.hbs`)
);

/**
 * @param {() => any} wrapped
 * @param {object} e - The attack dialog's JQuery form data or FormData object
 * @this ActionUse
 */
function addWeaponFocusBonus(wrapped, e) {
    wrapped();

    const { actor, item } = this;
    if (!actor && !item?.system.tags?.length) return;

    const tags = item.system.tags;

    const dFlags = actor.itemFlags.dictionary;
    const helper = new KeyedDFlagHelper(dFlags, racialWeaponFocusKey);

    const value = tags.find(value => helper.valuesForFlag(racialWeaponFocusKey).includes(value))
        ? 1
        : 0;

    if (value) {
        this.shared.attackBonus.push(`${value}[${localize(weaponFocusKey)}]`);
    }
}
Hooks.once('setup', () => libWrapper.register(MODULE_NAME, 'pf1.actionUse.ActionUse.prototype.alterRollData', addWeaponFocusBonus, libWrapper.WRAPPER));

// todo add text input if key is present
Hooks.on('renderItemSheet', (
    /** @type {{}} */ _app,
    /** @type {[HTMLElement]} */[html],
    /** @type {{ item: ItemPF; }} */ { item },
) => {
    const isRacial = item?.flags.core?.sourceId.includes(gnomeWeaponFocusId) || item.system.flags.dictionary.hasOwnProperty(racialWeaponFocusKey);
    if (!isRacial) return;

    const current = getDocDFlags(item, racialWeaponFocusKey);

    if (!current) {
        item.setItemDictionaryFlag(racialWeaponFocusKey, Settings.gnomish);
    }

    const templateData = { current, racialDefault: Settings.gnomish };
    const div = document.createElement('div');
    div.innerHTML = focusSelectorTemplate(templateData, { allowProtoMethodsByDefault: true, allowProtoPropertiesByDefault: true });;

    const select = div.querySelector('#weapon-focus-selector');
    select?.addEventListener(
        'change',
        async (event) => {
            // @ts-ignore - event.target is HTMLTextAreaElement
            const /** @type {HTMLTextAreaElement} */ target = event.target;
            await item.setItemDictionaryFlag(racialWeaponFocusKey, target?.value);
        },
    );
    addNodeToRollBonus(html, div);
});
