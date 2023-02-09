import { MODULE_NAME } from "../consts.mjs";
import { getItemDFlags } from "../util/actor-has-flagged-item.mjs";
import { setItemHelperHint } from "../util/item-hints.mjs";

const spellFocusKey = 'spellFocus';
const greaterSpellFocusKey = 'greaterSpellFocus';
const mythicSpellFocusKey = 'mythicSpellFocus';

const spellFocusId = 'V2zY7BltkpSXwejy';
const greaterSpellFocusId = 'LSykiaxYWzva2boF';
const mythicSpellFocusId = 'TOMEhAeZsgGHrSH6';

let focusSelectorTemplate;
Hooks.once(
    'setup',
    async () => focusSelectorTemplate = await getTemplate(`modules/${MODULE_NAME}/hbs/spell-focus-selector.hbs`)
);

// before dialog pops up
Hooks.on('pf1PreActionUse', (actionUse) => {
    const { actor, item, shared } = actionUse;
    if (item?.type !== 'spell') {
        return;
    }

    const handleFocus = (key) => {
        const focuses = getItemDFlags(actor, key);
        const hasFocus = !!focuses.find(f => f === item.system.school);
        if (hasFocus) {
            shared.saveDC += 1;

            const mythicFocuses = getItemDFlags(actor, mythicSpellFocusKey);
            const hasMythicFocus = !!mythicFocuses.find(f => f === item.system.school);
            if (hasMythicFocus) {
                shared.saveDC += 1;
            }
        }
    }

    handleFocus(spellFocusKey);
    handleFocus(greaterSpellFocusKey);
});

Hooks.on('renderItemSheet', (_app, [html], data) => {
    const flagsContainer = html.querySelector('.tab[data-tab="advanced"] .tags');
    if (!flagsContainer) {
        return;
    }

    const { item } = data;
    const name = item?.name?.toLowerCase() ?? '';

    let key;
    let spellSchools = pf1.config.spellSchools;

    if (name.includes('spell focus') || item?.flags.core.sourceId.includes(spellFocusId)) {
        key = spellFocusKey;
    }

    const isGreater = (name.includes('spell focus') && name.includes('greater')) || item?.flags.core.sourceId.includes(greaterSpellFocusId);
    const isMythic = (name.includes('spell focus') && name.includes('myth')) || item?.flags.core.sourceId.includes(mythicSpellFocusId);

    if (isGreater || isMythic) {
        key = isGreater ? greaterSpellFocusKey : mythicSpellFocusKey;

        const actor = item.actor;
        if (actor) {
            spellSchools = {};
            const existingSpellFocuses = getItemDFlags(actor, spellFocusKey);
            existingSpellFocuses.forEach((focus) => {
                spellSchools[focus] = pf1.config.spellSchools[focus];
            });
        }
    }

    if (!key) {
        return;
    }

    const currentSchool = getItemDFlags(item, key)[0];

    const templateData = { spellSchools, school: currentSchool };

    const div = document.createElement('div');
    div.innerHTML = focusSelectorTemplate(templateData, { allowProtoMethodsByDefault: true, allowProtoPropertiesByDefault: true });

    flagsContainer.appendChild(div);
    const select = div.querySelector('#spell-focus-selector');
    select.addEventListener(
        'change',
        async (event) => {
            await item.setItemDictionaryFlag(key, event.target.value);

            const oldValue = pf1.config.spellSchools[currentSchool] ?? currentSchool;
            const newValue = pf1.config.spellSchools[event.target.value] ?? event.target.value;
            await setItemHelperHint(item, oldValue, newValue);
        },
    );
});
