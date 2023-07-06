import { MODULE_NAME } from "../consts.mjs";
import { addElementToRollBonus } from "../roll-bonus-on-actor-sheet.mjs";
import { KeyedDFlagHelper, getDocDFlags } from "../util/flag-helpers.mjs";
import { registerItemHint } from "../util/item-hints.mjs";
import { localize } from "../util/localize.mjs";
import { registerSetting } from "../util/settings.mjs";

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

class Settings {
    static get weaponFocus() { return Settings.#getSetting(weaponFocusKey); }
    static get greater() { return Settings.#getSetting(greaterWeaponFocusKey); }
    static get gnome() { return Settings.#getSetting(gnomeWeaponFocusKey); }
    static get gnomish() { return Settings.#getSetting(gnomishTagKey); }
    // @ts-ignore
    static #getSetting(/** @type {string} */key) { return game.settings.get(MODULE_NAME, key).toLowerCase(); }
}

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

/**
 * @type {Handlebars.TemplateDelegate}
 */
let focusSelectorTemplate;
Hooks.once(
    'setup',
    async () => focusSelectorTemplate = await getTemplate(`modules/${MODULE_NAME}/hbs/weapon-focus-selector`)
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

    const tags = item.system.tags;
    let value = 0;

    const dFlags = actor.getRollData().dFlags;
    const helper = new KeyedDFlagHelper(dFlags, weaponFocusKey, greaterWeaponFocusKey);

    if (tags.find(value => helper.valuesForFlag(weaponFocusKey).includes(value))) {
        value += 1;
    }
    if (tags.find(value => helper.valuesForFlag(greaterWeaponFocusKey).includes(value))) {
        value += 1;
    }

    if (value) {
        this.shared.attackBonus.push(`${value}[${localize(weaponFocusKey)}]`);
    }
}

libWrapper.register(MODULE_NAME, 'pf1.actionUse.ActionUse.prototype.alterRollData', addWeaponFocusBonus, libWrapper.WRAPPER);

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
        choices = item.actor?.items
            ?.filter((item) => (item.type === 'weapon' || item.type === 'attack') && item.system.tags.includes(Settings.gnomish))
            .flatMap((item) => item.baseTypes);
    }

    if (!key) {
        // check if it has a manual key
        key = allKeys.find((k) => item.system.flags.dictionary[k] !== undefined);
        if (!key) {
            return;
        }
    }

    const current = getDocDFlags(item, key)[0];

    const templateData = { choices, school: current };

    const div = document.createElement('div');
    div.innerHTML = focusSelectorTemplate(templateData, { allowProtoMethodsByDefault: true, allowProtoPropertiesByDefault: true });

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

    addElementToRollBonus(html, div);
});
