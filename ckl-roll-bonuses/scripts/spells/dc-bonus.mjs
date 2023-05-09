import { getItemDFlags } from "../util/flag-helpers.mjs";

const key = 'genericSpellDC'

// before dialog pops up
Hooks.on('pf1PreActionUse', (actionUse) => {
    const { actor, item, shared } = actionUse;
    if (item?.type !== 'spell') {
        return;
    }

    const bonuses = getItemDFlags(actor, key);
    bonuses.forEach(bonus => {
        shared.saveDC += pf1.dice.D20RollPF.safeTotal(bonus, actor?.getRollData() ?? {});
    });
});
