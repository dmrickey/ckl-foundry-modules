import { countBFlags } from '../util/flag-helpers.mjs';
import { localHooks } from '../util/hooks.mjs';
import { registerItemHint } from '../util/item-hints.mjs';
import { localize } from '../util/localize.mjs';
import { truthiness } from '../util/truthiness.mjs';
import { fortune, misfortune } from './shared.mjs';

const selfFortune = 'self-fortune';
const selfMisfortune = 'self-misfortune';

const languageLookup = {
    [fortune]: fortune,
    [selfFortune]: fortune,
    [misfortune]: misfortune,
    [selfMisfortune]: misfortune,
}

const goodToBad = {
    fortune: misfortune,
};

const rolls = {
    fortune: '2d20kh',
    misfortune: '2d20kl',
};

registerItemHint((hintcls, _actor, item, _data) => {
    return Object.keys(languageLookup).map((key) => {
        if (!item.hasItemBooleanFlag(key)) {
            return;
        }

        const label = localize(languageLookup[key]);

        const hint = hintcls.create(label, [], {});
        return hint;
    }).filter(truthiness);
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

    Object.keys(goodToBad).forEach((f) => {
        fortuneCount += countBFlags(item?.parentActor?.items, f);
        misfortuneCount += countBFlags(item?.parentActor?.items, goodToBad[f]);
    });

    const roll = fortuneCount > misfortuneCount
        ? rolls.fortune
        : misfortuneCount > fortuneCount
            ? rolls.misfortune
            : '';

    options.dice = roll;
});
