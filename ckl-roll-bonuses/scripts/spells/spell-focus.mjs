import { MODULE_NAME } from "../consts.mjs";
import { getItemDFlags } from "../util/actor-has-flagged-item.mjs";

const spellFocusKey = 'spellFocus';
const greaterSpellFocusKey = 'greaterSpellFocus';

const spellFocusId = 'Compendium.pf1.feats.V2zY7BltkpSXwejy';
const greaterSpellFocusId = 'Compendium.pf1.feats.LSykiaxYWzva2boF';

let focusSelectorTemplate;
Hooks.once(
    'setup',
    async () => focusSelectorTemplate = await getTemplate(`modules/${MODULE_NAME}/hbs/focus-selector.hbs`)
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
        }
    }

    handleFocus(spellFocusKey);
    handleFocus(greaterSpellFocusKey);
});

Hooks.on('renderItemSheet', (app, [html], data) => {
    const flagsContainer = html.querySelector('.tab[data-tab="advanced"] .tags');
    if (!flagsContainer) {
        return;
    }

    const { item } = data;
    let key;
    if (item.name === 'Spell Focus' || item?.flags.core.sourceId === spellFocusId) {
        key = spellFocusKey;
    }

    if (item.name === 'Greater Spell Focus' || item?.flags.core.sourceId === greaterSpellFocusId) {
        key = greaterSpellFocusKey;
    }

    if (!key) {
        return;
    }

    const school = getItemDFlags(item, key)[0];

    const templateData = { spellSchools: pf1.config.spellSchools, school };

    const div = document.createElement('div');
    div.innerHTML = focusSelectorTemplate(templateData, { allowProtoMethodsByDefault: true, allowProtoPropertiesByDefault: true });

    flagsContainer.appendChild(div);
    const select = div.querySelector('#focus-selector');
    select.addEventListener(
        'change',
        async (event) => await item.setItemDictionaryFlag(key, event.target.value),
    );
});
