import { MODULE_NAME } from "../consts.mjs";
import { addElementToRollBonus } from "../roll-bonus-on-actor-sheet.mjs";
import { getItemDFlags } from "../util/actor-has-flagged-item.mjs";
import { setItemHelperHint } from "../util/item-hints.mjs";

const schoolClOffset = 'schoolClOffset';
const schoolClOffsetFormula = 'schoolClOffsetFormula';
const schoolClOffsetTotal = 'schoolClOffsetTotal';

let clOffsetTemplate;
Hooks.once(
    'setup',
    async () => clOffsetTemplate = await getTemplate(`modules/${MODULE_NAME}/hbs/school-cl-offset.hbs`)
);

Hooks.on('pf1PostReady', () => {
    Hooks.on('pf1GetRollData', (action, result) => {
        const actor = action?.parent?.actor;
        const item = action?.item;
        if (item?.type !== 'spell' || !actor) {
            return;
        }

        const currentSchools = getItemDFlags(actor, schoolClOffset);
        const totals = getItemDFlags(actor, schoolClOffsetTotal);

        const matches = [];
        for (let i = 0; i < currentSchools.length; i++) {
            const school = currentSchools[i];
            if (school === item.system.school) {
                matches.push({ school, total: totals[i] });
            }
        }

        if (!matches.length) {
            return;
        }

        const offsetCl = (value) => {
            result.cl += value;
        }

        const max = Math.max(...matches.map((x) => x.total));
        if (max > 0) {
            offsetCl(max);
        }

        const min = Math.min(...matches.map((x) => x.total));
        if (min < 0) {
            offsetCl(min);
        }
    });
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
    const total = getItemDFlags(item, schoolClOffsetTotal)[0];

    const templateData = { spellSchools, school: currentSchool, formula };

    const div = document.createElement('div');
    div.innerHTML = clOffsetTemplate(templateData, { allowProtoMethodsByDefault: true, allowProtoPropertiesByDefault: true });

    const input = div.querySelector('#school-cl-offset-formula');
    const select = div.querySelector('#school-cl-offset');

    const getHint = (t, s) => {
        const signed = `+${t}`.replace("+-", "-");
        return `CL ${signed} (${spellSchools[s] ?? s})`;
    }
    const currentHint = getHint(total, currentSchool);

    input.addEventListener(
        'change',
        async (event) => {
            const newFormula = event.target.value;
            await item.setItemDictionaryFlag(schoolClOffsetFormula, newFormula);

            const newTotal = RollPF.safeTotal(newFormula, actor.getRollData());
            await item.setItemDictionaryFlag(schoolClOffsetTotal, newTotal);

            const newValue = getHint(newTotal, currentSchool)
            await setItemHelperHint(item, currentHint, newValue);
        },
    );

    select.addEventListener(
        'change',
        async (event) => {
            await item.setItemDictionaryFlag(schoolClOffset, event.target.value);

            const newValue = getHint(total, event.target.value)
            await setItemHelperHint(item, currentHint, newValue);
        },
    );

    addElementToRollBonus(html, div);
});
