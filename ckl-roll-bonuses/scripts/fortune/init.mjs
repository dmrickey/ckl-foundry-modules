import { countBFlags } from '../util/flag-helpers.mjs';
import { localHooks } from '../util/hooks.mjs';
import { registerItemHint } from '../util/item-hints.mjs';
import { localize } from '../util/localize.mjs';
import { truthiness } from '../util/truthiness.mjs';

const fortune = 'fortune';
const misfortune = 'misfortune';

const selfFortune = 'self-fortune';
const selfMisfortune = 'self-misfortune';

const skillFortune = 'fortune-skill';
const skillMisfortune = 'misfortune-skill';

const abilityFortune = 'fortune-ability';
const abilityMisfortune = 'misfortune-ability';

const languageLookup = {
    [fortune]: fortune,
    [selfFortune]: fortune,
    [skillFortune]: fortune,

    [misfortune]: misfortune,
    [selfMisfortune]: misfortune,
    [skillMisfortune]: misfortune,
}

const rolls = {
    fortune: '2d20kh',
    misfortune: '2d20kl',
};

registerItemHint((hintcls, _actor, item, _data) => {
    const hints = Object.keys(languageLookup).map((key) => {
        if (!item.hasItemBooleanFlag(key)) {
            return;
        }

        const label = localize(languageLookup[key]);

        const hint = hintcls.create(label, [], {});
        return hint;
    }).filter(truthiness);

    [skillFortune, skillMisfortune].forEach((key) => {
        if (Object.keys(item.system.flags.boolean).some((flag) => flag.startsWith(`${key}-`))) {
            const label = localize(key);
            const hint = hintcls.create(label, [], {});
            hints.push(hint);
        }
    });

    return hints;
});

Hooks.on(localHooks.itemUse, (item, options) => {
    if (options.dice && options.dice !== rolls.fortune && options.dice !== rolls.misfortune) {
        return;
    }

    let fortuneCount = 0;
    let misfortuneCount = 0;

    if (options.dice === rolls.fortune) {
        fortuneCount++;
    }
    else if (options.dice === rolls.misfortune) {
        misfortuneCount++;
    }

    if (item.hasItemBooleanFlag(selfFortune)) {
        fortuneCount++;
    }
    else if (item.hasItemBooleanFlag(selfMisfortune)) {
        misfortuneCount++;
    }

    const roll = fortuneCount > misfortuneCount
        ? rolls.fortune
        : misfortuneCount > fortuneCount
            ? rolls.misfortune
            : '';

    options.dice = roll;
});

Hooks.on('pf1PreActorRollSkill', (actor, options, skillId) => {
    if (options.dice && options.dice !== rolls.fortune && options.dice !== rolls.misfortune) {
        return;
    }

    let fortuneCount = 0;
    let misfortuneCount = 0;

    if (options.dice === rolls.fortune) {
        fortuneCount++;
    }
    else if (options.dice === rolls.misfortune) {
        misfortuneCount++;
    }

    fortuneCount += countBFlags(actor?.items, fortune);
    misfortuneCount += countBFlags(actor?.items, misfortune);
    fortuneCount += countBFlags(actor?.items, skillFortune);
    misfortuneCount += countBFlags(actor?.items, skillMisfortune);

    fortuneCount += countBFlags(actor?.items, `${skillFortune}-${skillId}`);
    misfortuneCount += countBFlags(actor?.items, `${skillMisfortune}-${skillId}`);

    const roll = fortuneCount > misfortuneCount
        ? rolls.fortune
        : misfortuneCount > fortuneCount
            ? rolls.misfortune
            : undefined;

    options.dice = roll;
});

// does not work in 082.5
Hooks.on('pf1PreActorRollAbility', (actor, options, ability) => {
    if (options.dice && options.dice !== rolls.fortune && options.dice !== rolls.misfortune) {
        return;
    }

    let fortuneCount = 0;
    let misfortuneCount = 0;

    if (options.dice === rolls.fortune) {
        fortuneCount++;
    }
    else if (options.dice === rolls.misfortune) {
        misfortuneCount++;
    }

    fortuneCount += countBFlags(actor?.items, fortune);
    misfortuneCount += countBFlags(actor?.items, misfortune);
    fortuneCount += countBFlags(actor?.items, abilityFortune);
    misfortuneCount += countBFlags(actor?.items, abilityMisfortune);

    fortuneCount += countBFlags(actor?.items, `${abilityFortune}-${ability}`);
    misfortuneCount += countBFlags(actor?.items, `${abilityMisfortune}-${ability}`);

    const roll = fortuneCount > misfortuneCount
        ? rolls.fortune
        : misfortuneCount > fortuneCount
            ? rolls.misfortune
            : undefined;

    options.dice = roll;
});

// pf1PreActorRollAttack
// pf1PreActorRollBab
// pf1PreActorRollCl
// pf1PreActorRollConcentration

// does not work in 0.82.5
// pf1PreActorRollCmb
// pf1PreActorRollSave
