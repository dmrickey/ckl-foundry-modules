import { MODULE_NAME } from "../consts.mjs";
import { addNodeToRollBonus } from "../roll-bonus-on-actor-sheet.mjs";
import { KeyedDFlagHelper, getDocDFlags } from "../util/flag-helpers.mjs";
import { registerItemHint } from "../util/item-hints.mjs";
import { localize } from "../util/localize.mjs";
import { registerSetting } from "../util/settings.mjs";
import { uniqueArray } from "../util/unique-array.mjs";

// todo
//  - single select option can't be selected

const weaponFocusKey = 'weapon-focus';
const greaterWeaponFocusKey = 'greater-weapon-focus';
const gnomeWeaponFocusKey = 'gnome-weapon-focus';
const gnomishTagKey = 'gnomish-tag';

const allKeys = [weaponFocusKey, greaterWeaponFocusKey];

const weaponFocusId = 'n250dFlbykAIAg5Z';
const greaterWeaponFocusId = 'IER2MzJrjSvxMlNS';
const gnomeWeaponFocusId = '8RzIeYtbx0UtXUge';

registerSetting({ key: weaponFocusKey });
registerSetting({ key: greaterWeaponFocusKey });
registerSetting({ key: gnomeWeaponFocusKey });
registerSetting({ key: gnomishTagKey });

class Settings {
    static get weaponFocus() { return Settings.#getSetting(weaponFocusKey); }
    static get greater() { return Settings.#getSetting(greaterWeaponFocusKey); }
    static get gnome() { return Settings.#getSetting(gnomeWeaponFocusKey); }
    static get gnomish() { return Settings.#getSetting(gnomishTagKey); }
    // @ts-ignore
    static #getSetting(/** @type {string} */key) { return game.settings.get(MODULE_NAME, key).toLowerCase(); }
}

// register hint on item with focus
registerItemHint((hintcls, _actor, item, _data) => {
    const key = allKeys.find((k) => item.system.flags.dictionary[k] !== undefined);
    if (!key) {
        return;
    }

    const current = getDocDFlags(item, key)[0];
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

    const baseTypes = item.system.baseTypes;
    let value = 0;

    const dFlags = actor.itemFlags.dictionary;
    const helper = new KeyedDFlagHelper(dFlags, weaponFocusKey, greaterWeaponFocusKey);

    let label;
    if (baseTypes.find(value => helper.valuesForFlag(greaterWeaponFocusKey).includes(value))) {
        label = localize(greaterWeaponFocusKey);
    }
    else if (baseTypes.find(value => helper.valuesForFlag(weaponFocusKey).includes(value))) {
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

    const baseTypes = this.system.baseTypes;
    let value = 0;
    let name = localize(weaponFocusKey);

    const dFlags = this.actor.itemFlags.dictionary;
    const helper = new KeyedDFlagHelper(dFlags, weaponFocusKey, greaterWeaponFocusKey);

    if (baseTypes.find(bt => helper.valuesForFlag(weaponFocusKey).includes(bt))) {
        value += 1;
    }
    if (baseTypes.find(bt => helper.valuesForFlag(greaterWeaponFocusKey).includes(bt))) {
        value += 1;
        name = localize(greaterWeaponFocusKey);
    }

    if (value) {
        sources.push({ value, name, modifier: -100 });

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
    async () => focusSelectorTemplate = await getTemplate(`modules/${MODULE_NAME}/hbs/weapon-focus-selector.hbs`)
);

/**
 *
 * @param {() => any} wrapped
 * @param {object} e - The attack dialog's JQuery form data or FormData object
 * @this ActionUse
 */
function addWeaponFocusBonus(wrapped, e) {
    wrapped();

    const { actor, item } = this;
    if (!actor && (!item || !item.system.tags?.length)) return;

    const baseTypes = item.system.baseTypes;
    let value = 0;

    const dFlags = actor.itemFlags.dictionary;
    const helper = new KeyedDFlagHelper(dFlags, weaponFocusKey, greaterWeaponFocusKey);

    if (baseTypes.find(value => helper.valuesForFlag(weaponFocusKey).includes(value))) {
        value += 1;
    }
    if (baseTypes.find(value => helper.valuesForFlag(greaterWeaponFocusKey).includes(value))) {
        value += 1;
        debugger;
    }

    if (value) {
        this.shared.attackBonus.push(`${value}[${localize(weaponFocusKey)}]`);
    }
}

Hooks.once('setup', () => libWrapper.register(MODULE_NAME, 'pf1.actionUse.ActionUse.prototype.alterRollData', addWeaponFocusBonus, libWrapper.WRAPPER));

Hooks.on('renderItemSheet', (
    /** @type {{}} */ _app,
    /** @type {[HTMLElement]} */[html],
    /** @type {{ item: ItemPF; }} */ { item },
) => {
    const name = item?.name?.toLowerCase() ?? '';

    /**
     * @type {string | undefined}
     */
    let key;
    /**
     * @type {(string | number)[]}
     */
    let choices = [];

    const isGreater = (name.includes(Settings.weaponFocus) && name.includes(Settings.greater)) || item?.flags.core?.sourceId.includes(greaterWeaponFocusId);
    const isGnome = (name.includes(Settings.weaponFocus) && name.includes(Settings.gnome)) || item?.flags.core?.sourceId.includes(gnomeWeaponFocusId);

    if (isGreater) {
        key = greaterWeaponFocusKey;

        const actor = item.actor;
        if (actor) {
            choices = getDocDFlags(actor, weaponFocusKey);
        }
    }
    else if (name.includes(Settings.weaponFocus) || item?.flags.core?.sourceId.includes(weaponFocusId) && !isGnome) {
        key = weaponFocusKey;
        choices = uniqueArray(item.actor?.items
            ?.filter((item) => item.type === 'weapon' || item.type === 'attack')
            .flatMap((item) => item.system.baseTypes ?? []));
    }

    if (!key) {
        // check if it has a manual key
        key = allKeys.find((k) => item.system.flags.dictionary[k] !== undefined);
        if (!key) {
            return;
        }
    }

    const current = getDocDFlags(item, key)[0];

    if (choices?.length === 1 && !current) {
        item.setItemDictionaryFlag(key, choices[0]);
    }

    const templateData = { choices, current };
    const template = focusSelectorTemplate(templateData, { allowProtoMethodsByDefault: true, allowProtoPropertiesByDefault: true });
    const div = document.createElement('div');
    div.innerHTML = template;

    const select = div.querySelector('#weapon-focus-selector');
    select?.addEventListener(
        'change',
        async (event) => {
            if (!key) return;
            // @ts-ignore - event.target is HTMLTextAreaElement
            const /** @type {HTMLTextAreaElement} */ target = event.target;
            await item.setItemDictionaryFlag(key, target?.value);
        },
    );
    addNodeToRollBonus(html, div);
});
