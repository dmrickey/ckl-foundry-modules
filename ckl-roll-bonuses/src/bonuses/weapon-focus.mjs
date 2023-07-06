import { MODULE_NAME } from "../consts.mjs";
import { addElementToRollBonus } from "../roll-bonus-on-actor-sheet.mjs";
import { getDocDFlags } from "../util/flag-helpers.mjs";
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

/**
 * @type {Handlebars.TemplateDelegate}
 */
let focusSelectorTemplate;
Hooks.once(
    'setup',
    async () => focusSelectorTemplate = await getTemplate(`modules/${MODULE_NAME}/hbs/weapon-focus-selector`)
);

// before dialog pops up
Hooks.on('pf1PreActionUse', (/** @type {ActionUse} */actionUse) => {
    // const { actor, item, shared } = actionUse;
    // if (item?.type !== 'spell') {
    //     return;
    // }

    // /**
    //  * @param {string} key
    //  */
    // const handleFocus = (key) => {
    //     const focuses = getDocDFlags(actor, key);
    //     const hasFocus = !!focuses.find(f => item.baseTypes.includes(`${f}`));
    //     if (hasFocus) {
    //         shared.saveDC += 1;

    //         const mythicFocuses = getDocDFlags(actor, mythicSpellFocusKey);
    //         const hasMythicFocus = !!mythicFocuses.find(f => f === item.system.school);
    //         if (hasMythicFocus) {
    //             shared.saveDC += 1;
    //         }
    //     }
    // }

    // handleFocus(spellFocusKey);
    // handleFocus(greaterSpellFocusKey);
});

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
