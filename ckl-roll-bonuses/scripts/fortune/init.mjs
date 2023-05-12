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

const attackFortune = 'fortune-attack';
const attackMisfortune = 'misfortune-attack';

const babFortune = 'fortune-bab';
const babMisfortune = 'misfortune-bab';

const clFortune = 'fortune-cl';
const clMisfortune = 'misfortune-cl';

const concentrationFortune = 'fortune-concentration';
const concentrationMisfortune = 'misfortune-concentration';

const saveFortune = 'fortune-save';
const saveMisfortune = 'misfortune-save';

const languageLookup = {
    [fortune]: fortune,
    [selfFortune]: fortune,
    [skillFortune]: fortune,
    [abilityFortune]: fortune,
    [attackFortune]: fortune,
    [babFortune]: fortune,
    [clFortune]: fortune,
    [concentrationFortune]: fortune,
    [saveFortune]: fortune,

    [misfortune]: misfortune,
    [selfMisfortune]: misfortune,
    [skillMisfortune]: misfortune,
    [abilityMisfortune]: misfortune,
    [attackMisfortune]: misfortune,
    [babMisfortune]: misfortune,
    [clMisfortune]: misfortune,
    [concentrationMisfortune]: misfortune,
    [saveMisfortune]: misfortune,
}

const rolls = {
    fortune: ['2d20kh', '2d20dl'],
    misfortune: ['2d20kl', '2d20dh'],
};
const allRolls = Object.values(rolls).flatMap(x => x);

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
    if (options.dice && !allRolls.includes(options.dice)) {
        return;
    }

    let fortuneCount = 0;
    let misfortuneCount = 0;

    if (rolls.fortune.includes(options.dice)) {
        fortuneCount++;
    }
    else if (rolls.misfortune.includes(options.dice)) {
        misfortuneCount++;
    }

    if (item.hasItemBooleanFlag(selfFortune)) {
        fortuneCount++;
    }
    else if (item.hasItemBooleanFlag(selfMisfortune)) {
        misfortuneCount++;
    }

    fortuneCount += countBFlags(item.parent?.items, attackFortune);
    misfortuneCount += countBFlags(item.parent?.items, attackMisfortune);

    fortuneCount += countBFlags(item.parent?.items, fortune);
    misfortuneCount += countBFlags(item.parent?.items, misfortune);

    const roll = fortuneCount > misfortuneCount
        ? rolls.fortune[0]
        : misfortuneCount > fortuneCount
            ? rolls.misfortune[0]
            : '';

    options.dice = roll;
});

Hooks.on('pf1PreActorRollSkill', (actor, options, skillId) => {
    if (options.dice && !allRolls.includes(options.dice)) {
        return;
    }

    let fortuneCount = 0;
    let misfortuneCount = 0;

    if (rolls.fortune.includes(options.dice)) {
        fortuneCount++;
    }
    else if (rolls.misfortune.includes(options.dice)) {
        misfortuneCount++;
    }

    fortuneCount += countBFlags(actor?.items, fortune);
    misfortuneCount += countBFlags(actor?.items, misfortune);
    fortuneCount += countBFlags(actor?.items, skillFortune);
    misfortuneCount += countBFlags(actor?.items, skillMisfortune);

    fortuneCount += countBFlags(actor?.items, `${skillFortune}-${skillId}`);
    misfortuneCount += countBFlags(actor?.items, `${skillMisfortune}-${skillId}`);

    const roll = fortuneCount > misfortuneCount
        ? rolls.fortune[0]
        : misfortuneCount > fortuneCount
            ? rolls.misfortune[0]
            : undefined;

    options.dice = roll;
});

Hooks.on('pf1PreActorRollAttack', (actor, options) => {
    if (options.dice && !allRolls.includes(options.dice)) {
        return;
    }

    let fortuneCount = 0;
    let misfortuneCount = 0;

    if (rolls.fortune.includes(options.dice)) {
        fortuneCount++;
    }
    else if (rolls.misfortune.includes(options.dice)) {
        misfortuneCount++;
    }

    fortuneCount += countBFlags(actor?.items, fortune);
    misfortuneCount += countBFlags(actor?.items, misfortune);
    fortuneCount += countBFlags(actor?.items, attackFortune);
    misfortuneCount += countBFlags(actor?.items, attackMisfortune);

    if (options.melee) {
        fortuneCount += countBFlags(actor?.items, `${attackFortune}-melee`);
        misfortuneCount += countBFlags(actor?.items, `${attackMisfortune}-melee`);
    } {
        fortuneCount += countBFlags(actor?.items, `${attackFortune}-ranged}`);
        misfortuneCount += countBFlags(actor?.items, `${attackMisfortune}-ranged}`);
    }

    const roll = fortuneCount > misfortuneCount
        ? rolls.fortune[0]
        : misfortuneCount > fortuneCount
            ? rolls.misfortune[0]
            : undefined;

    options.dice = roll;
});

Hooks.on('pf1PreActorRollBab', (actor, options) => {
    if (options.dice && !allRolls.includes(options.dice)) {
        return;
    }

    let fortuneCount = 0;
    let misfortuneCount = 0;

    if (rolls.fortune.includes(options.dice)) {
        fortuneCount++;
    }
    else if (rolls.misfortune.includes(options.dice)) {
        misfortuneCount++;
    }

    fortuneCount += countBFlags(actor?.items, fortune);
    misfortuneCount += countBFlags(actor?.items, misfortune);
    fortuneCount += countBFlags(actor?.items, babFortune);
    misfortuneCount += countBFlags(actor?.items, babMisfortune);

    const roll = fortuneCount > misfortuneCount
        ? rolls.fortune[0]
        : misfortuneCount > fortuneCount
            ? rolls.misfortune[0]
            : undefined;

    options.dice = roll;
});

// todo add book handler
Hooks.on('pf1PreActorRollCl', (actor, bookId, options) => {
    if (options.dice && !allRolls.includes(options.dice)) {
        return;
    }

    let fortuneCount = 0;
    let misfortuneCount = 0;

    if (rolls.fortune.includes(options.dice)) {
        fortuneCount++;
    }
    else if (rolls.misfortune.includes(options.dice)) {
        misfortuneCount++;
    }

    fortuneCount += countBFlags(actor?.items, fortune);
    misfortuneCount += countBFlags(actor?.items, misfortune);
    fortuneCount += countBFlags(actor?.items, clFortune);
    misfortuneCount += countBFlags(actor?.items, clMisfortune);

    const roll = fortuneCount > misfortuneCount
        ? rolls.fortune[0]
        : misfortuneCount > fortuneCount
            ? rolls.misfortune[0]
            : undefined;

    options.dice = roll;
});

// todo add book handler
Hooks.on('pf1PreActorRollConcentration', (actor, options, bookId) => {
    if (options.dice && !allRolls.includes(options.dice)) {
        return;
    }

    let fortuneCount = 0;
    let misfortuneCount = 0;

    if (rolls.fortune.includes(options.dice)) {
        fortuneCount++;
    }
    else if (rolls.misfortune.includes(options.dice)) {
        misfortuneCount++;
    }

    fortuneCount += countBFlags(actor?.items, fortune);
    misfortuneCount += countBFlags(actor?.items, misfortune);
    fortuneCount += countBFlags(actor?.items, concentrationFortune);
    misfortuneCount += countBFlags(actor?.items, concentrationMisfortune);

    const roll = fortuneCount > misfortuneCount
        ? rolls.fortune[0]
        : misfortuneCount > fortuneCount
            ? rolls.misfortune[0]
            : undefined;

    options.dice = roll;
});

const handleAbility = (actor, options, ability) => {
    if (options.dice && !allRolls.includes(options.dice)) {
        return;
    }

    let fortuneCount = 0;
    let misfortuneCount = 0;

    if (rolls.fortune.includes(options.dice)) {
        fortuneCount++;
    }
    else if (rolls.misfortune.includes(options.dice)) {
        misfortuneCount++;
    }

    fortuneCount += countBFlags(actor?.items, fortune);
    misfortuneCount += countBFlags(actor?.items, misfortune);
    fortuneCount += countBFlags(actor?.items, abilityFortune);
    misfortuneCount += countBFlags(actor?.items, abilityMisfortune);

    fortuneCount += countBFlags(actor?.items, `${abilityFortune}-${ability}`);
    misfortuneCount += countBFlags(actor?.items, `${abilityMisfortune}-${ability}`);

    const roll = fortuneCount > misfortuneCount
        ? rolls.fortune[0]
        : misfortuneCount > fortuneCount
            ? rolls.misfortune[0]
            : undefined;

    options.dice = roll;
};
// does not work in 0.82.5
Hooks.on('pf1PreActorRollAbility', handleAbility);
Hooks.on(localHooks.rollAbilityTest, (actor, abilityId, options) => handleAbility(actor, options, abilityId));

const handleCmb = (actor, options) => {
    if (options.dice && !allRolls.includes(options.dice)) {
        return;
    }

    let fortuneCount = 0;
    let misfortuneCount = 0;

    if (rolls.fortune.includes(options.dice)) {
        fortuneCount++;
    }
    else if (rolls.misfortune.includes(options.dice)) {
        misfortuneCount++;
    }

    fortuneCount += countBFlags(actor?.items, fortune);
    misfortuneCount += countBFlags(actor?.items, misfortune);
    fortuneCount += countBFlags(actor?.items, attackFortune);
    misfortuneCount += countBFlags(actor?.items, attackMisfortune);
    fortuneCount += countBFlags(actor?.items, babFortune);
    misfortuneCount += countBFlags(actor?.items, babMisfortune);

    const roll = fortuneCount > misfortuneCount
        ? rolls.fortune[0]
        : misfortuneCount > fortuneCount
            ? rolls.misfortune[0]
            : undefined;

    options.dice = roll;
};
// does not work in 0.82.5
// Hooks.on('pf1PreActorRollCmb', handleCmb);
Hooks.on(localHooks.rollCMB, handleCmb);

const handleSavingThrow = (actor, options, savingThrowId) => {
    if (options.dice && !allRolls.includes(options.dice)) {
        return;
    }

    let fortuneCount = 0;
    let misfortuneCount = 0;

    if (rolls.fortune.includes(options.dice)) {
        fortuneCount++;
    }
    else if (rolls.misfortune.includes(options.dice)) {
        misfortuneCount++;
    }

    fortuneCount += countBFlags(actor?.items, fortune);
    misfortuneCount += countBFlags(actor?.items, misfortune);
    fortuneCount += countBFlags(actor?.items, saveFortune);
    misfortuneCount += countBFlags(actor?.items, saveMisfortune);

    fortuneCount += countBFlags(actor?.items, `${saveFortune}-${savingThrowId}`);
    misfortuneCount += countBFlags(actor?.items, `${saveMisfortune}-${savingThrowId}`);

    const roll = fortuneCount > misfortuneCount
        ? rolls.fortune[0]
        : misfortuneCount > fortuneCount
            ? rolls.misfortune[0]
            : undefined;

    options.dice = roll;
};
// does not work in 0.82.5
// Hooks.on('pf1PreActorRollSave', handleSavingThrow);
Hooks.on(localHooks.rollSavingThrow, (actor, savingThrowId, options) => handleSavingThrow(actor, options, savingThrowId));
