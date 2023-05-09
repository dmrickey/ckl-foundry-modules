import { MODULE_NAME } from "../consts.mjs";
import { addElementToRollBonus } from "../roll-bonus-on-actor-sheet.mjs";
import { getFlagsFromDFlags, getItemDFlags } from "../util/flag-helpers.mjs";
import { registerItemHint } from "../util/item-hints.mjs";

const schoolClOffset = 'schoolClOffset';
const schoolClOffsetFormula = 'schoolClOffsetFormula';
const schoolClOffsetTotal = 'schoolClOffsetTotal';

let clOffsetTemplate;
Hooks.once(
    'setup',
    async () => clOffsetTemplate = await getTemplate(`modules/${MODULE_NAME}/hbs/school-cl-offset.hbs`)
);

Hooks.on('pf1GetRollData', (action, result) => {
    if (!(action instanceof pf1.components.ItemAction)) {
        return;
    }

    const item = action?.item;
    if (item?.type !== 'spell' || !item.system?.school || !result) {
        return;
    }

    const offsets = getFlagsFromDFlags(result.dFlags, schoolClOffset, schoolClOffsetTotal);
    const matches = offsets.filter((o) => o[schoolClOffset] === item.system.school);

    if (!matches.length) {
        return;
    }

    const offsetCl = (value) => {
        if (result.hasOwnProperty('cl')) {
            result.cl ||= 0;
            result.cl += value;
        }
    }

    const values = matches.map((x) => x[schoolClOffsetTotal] || 0);

    const max = Math.max(...values);
    if (max > 0) {
        offsetCl(max);
    }

    const min = Math.min(...values);
    if (min < 0) {
        offsetCl(min);
    }
});

Hooks.on('renderItemSheet', (app, [html], data) => {
    const { actor } = app;
    const { item } = data;

    const { spellSchools } = pf1.config;

    const hasKey = item.system.flags.dictionary[schoolClOffset] !== undefined
        || item.system.flags.dictionary[schoolClOffsetFormula] !== undefined;
    if (!hasKey) {
        return;
    }

    const currentSchool = getItemDFlags(item, schoolClOffset)[0];
    const formula = getItemDFlags(item, schoolClOffsetFormula)[0];

    const templateData = { spellSchools, school: currentSchool, formula };

    const div = document.createElement('div');
    div.innerHTML = clOffsetTemplate(templateData, { allowProtoMethodsByDefault: true, allowProtoPropertiesByDefault: true });

    const input = div.querySelector('#school-cl-offset-formula');
    const select = div.querySelector('#school-cl-offset');

    input.addEventListener(
        'change',
        async (event) => {
            const newFormula = event.target.value;
            await item.setItemDictionaryFlag(schoolClOffsetFormula, newFormula);

            const newTotal = RollPF.safeTotal(newFormula, actor.getRollData());
            await item.setItemDictionaryFlag(schoolClOffsetTotal, newTotal);
        },
    );

    select.addEventListener(
        'change',
        async (event) => {
            await item.setItemDictionaryFlag(schoolClOffset, event.target.value);
        },
    );

    addElementToRollBonus(html, div);
});

registerItemHint((hintcls, _actor, item, _data) => {
    const currentSchool = getItemDFlags(item, schoolClOffset)[0];
    if (!currentSchool) {
        return [];
    }

    const { spellSchools } = pf1.config;
    const total = getItemDFlags(item, schoolClOffsetTotal)[0];
    if (!total) {
        return;
    }

    const getHint = (t, s) => {
        const signed = `+${t}`.replace("+-", "-");
        return `CL ${signed} (${spellSchools[s] ?? s})`;
    }
    const label = getHint(total, currentSchool);

    const hint = hintcls.create(label, [], {});
    return [hint];
});
