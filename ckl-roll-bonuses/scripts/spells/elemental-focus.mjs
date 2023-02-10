import { MODULE_NAME } from "../consts.mjs";
import { getItemDFlags } from "../util/actor-has-flagged-item.mjs";
import { setItemHelperHint } from "../util/item-hints.mjs";
import { truthiness } from "../util/truthiness.mjs";

const elementalFocusKey = 'elementalFocus';
const greaterElementalFocusKey = 'greaterElementalFocus';
const mythicElementalFocusKey = 'mythicElementalFocus';

const elementalFocusId = '1frgqDSnQFiTq0MC';
const greaterElementalFocusId = 'l4yE4RGFbORuDfp7';
const mythicElementalFocusId = 'yelJyBhjWtiIMgci';

const damageElements = [
    'acid',
    'cold',
    'electric',
    'fire'
];

const intersects = (a, b) => {
    const setA = new Set(a);
    const setB = new Set(b);
    const overlap = [...setA].filter(x => setB.has(x));
    return !!overlap.length;
}

let focusSelectorTemplate;
Hooks.once(
    'setup',
    async () => focusSelectorTemplate = await getTemplate(`modules/${MODULE_NAME}/hbs/elemental-focus-selector.hbs`)
);

// before dialog pops up
Hooks.on('pf1PreActionUse', (actionUse) => {
    const { action, actor, item, shared } = actionUse;
    if (item?.type !== 'spell') {
        return;
    }

    const damageTypes = action.data.damage.parts
        .flatMap(([_, { custom, values }]) => ([...custom.split(';').map(x => x.trim()), ...values]))
        .filter(truthiness);

    const handleFocus = (key) => {
        const focuses = getItemDFlags(actor, key);
        const hasFocus = intersects(damageTypes, focuses);
        if (hasFocus) {
            shared.saveDC += 1;

            const mythicFocuses = getItemDFlags(actor, mythicElementalFocusKey);
            const hasMythicFocus = intersects(damageTypes, mythicFocuses);
            if (hasMythicFocus) {
                shared.saveDC += 1;
            }
        }
    }

    handleFocus(elementalFocusKey);
    handleFocus(greaterElementalFocusKey);
});

Hooks.on('renderItemSheet', (_app, [html], data) => {
    const flagsContainer = html.querySelector('.tab[data-tab="advanced"] .tags');
    if (!flagsContainer) {
        return;
    }

    const { item } = data;
    const name = item?.name?.toLowerCase() ?? '';

    let key;
    let elements = Object.fromEntries(damageElements.map(k => [k, pf1.config.damageTypes[k]]));;

    if (name.includes('elemental focus') || item?.flags.core?.sourceId.includes(elementalFocusId)) {
        key = elementalFocusKey;
    }

    const isGreater = (name.includes('elemental focus') && name.includes('greater')) || item?.flags.core?.sourceId.includes(greaterElementalFocusId);
    const isMythic = (name.includes('elemental focus') && name.includes('myth')) || item?.flags.core?.sourceId.includes(mythicElementalFocusId);

    if (isGreater || isMythic) {
        key = isGreater ? greaterElementalFocusKey : mythicElementalFocusKey;

        const actor = item.actor;
        if (actor) {
            elements = {};
            const existingElementalFocuses = getItemDFlags(actor, elementalFocusKey);
            existingElementalFocuses.forEach((focus) => {
                elements[focus] = pf1.config.damageTypes[focus];
            });
        }
    }

    if (!key) {
        return;
    }

    const currentElement = getItemDFlags(item, key)[0];

    const templateData = { elements, element: currentElement };

    const div = document.createElement('div');
    div.innerHTML = focusSelectorTemplate(templateData, { allowProtoMethodsByDefault: true, allowProtoPropertiesByDefault: true });

    flagsContainer.appendChild(div);
    const select = div.querySelector('#elemental-focus-selector');
    select.addEventListener(
        'change',
        async (event) => {
            await item.setItemDictionaryFlag(key, event.target.value);

            const oldValue = pf1.config.damageTypes[currentElement] ?? currentElement;
            const newValue = pf1.config.damageTypes[event.target.value] ?? event.target.value;
            await setItemHelperHint(item, oldValue, newValue);
        },
    );
});
