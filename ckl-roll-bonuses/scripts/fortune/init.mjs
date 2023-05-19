import { MODULE_NAME } from '../consts.mjs';
import { countBFlags } from '../util/flag-helpers.mjs';
import { localHooks } from '../util/hooks.mjs';
import { registerItemHint } from '../util/item-hints.mjs';
import { localize } from '../util/localize.mjs';
import { registerSetting } from '../util/settings.mjs';

const fortune = 'fortune';
const misfortune = 'misfortune';

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
const initFortune = 'fortune-init';
const initWarsightFortune = 'fortune-warsight-init';
const initMisfortune = 'misfortune-init';
const saveFortune = 'fortune-save';
const saveMisfortune = 'misfortune-save';
const selfFortune = 'fortune-self-item';
const selfMisfortune = 'misfortune-self-item';
const skillFortune = 'fortune-skill';
const skillMisfortune = 'misfortune-skill';

let fortunesLookup = {};

Hooks.once('ready', () => {
    fortunesLookup = {
        [abilityFortune]: (key) => key ? pf1.config.abilities[key] : localize('PF1.Ability'),
        [attackFortune]: (key) => !key ? localize('PF1.Attack') : key === 'melee' ? localize('PF1.Melee') : localize('PF1.Ranged'),
        [babFortune]: () => localize('PF1.BABAbbr'),
        [initFortune]: () => localize('PF1.Initiative'),
        [initWarsightFortune]: localize('PF1.Initiative'),
        [saveFortune]: (key) => key ? pf1.config.savingThrows[key] : localize('PF1.Save'),
        [selfFortune]: () => localize('PF1.TargetSelf'),
        [skillFortune]: (key, actor) => !key ? localize('PF1.Skills') : pf1.config.skills[key] || getProperty(actor.system.skills, key)?.name,
        [clFortune]: (_key) => localize('PF1.CasterLevel'),
        [concentrationFortune]: (_key) => localize('PF1.Concentration'),
    };
});

const fortuneStacks = 'fortuneStacks';
registerSetting({ key: fortuneStacks, settingType: Boolean, defaultValue: true });

class Settings {
    static get fortuneStacks() { return Settings.#getSetting(fortuneStacks); }
    static #getSetting(key) { return game.settings.get(MODULE_NAME, key); }
}

registerItemHint((hintcls, actor, item, _data) => {
    const bFlags = Object.entries(item.system?.flags?.boolean ?? {})
        .filter(([_, value]) => !!value)
        .map(([key, _]) => key);

    const fortunes = bFlags.filter(flag => flag.startsWith('fortune'));
    const misfortunes = bFlags.filter(flag => flag.startsWith('misfortune'));

    const hints = [];

    const buildHint = (found, isFortune) => {
        if (!found.length) return;

        const base = isFortune ? fortune : misfortune;
        let label = localize(base);
        let extra = [];

        found.forEach(f => {
            if (f === base) return;

            let [fType, ...rest] = f.split('_');
            const key = rest.join('_');
            extra.push(fortunesLookup[fType.slice(isFortune ? 0 : 3)](key, actor));
        });

        if (extra.length) {
            label = `${label} (${extra.join(', ')})`;
        }
        hints.push(hintcls.create(label, [], {}));
    }

    buildHint(fortunes, true);
    buildHint(misfortunes, false);

    return hints;
});

const handleFortune = (options) => {
    options.dice ||= '1d20';
    options.fortuneCount ||= 0;
    options.misfortuneCount ||= 0;

    {
        const test = new Roll(options.dice).roll({ async: false });
        const dice = test.dice[0];
        const { modifiers, results } = dice;
        const totalThrown = results.length;
        if (test.dice.length !== 1 // if there was more than a single dice term
            || dice.faces !== 20 // if the die is not a d20
            || modifiers.length > 1 // if there were somehow multiple dice modifier text on the throw
            || results.filter(x => !x.discarded).length !== 1 // if more than a single die was kept into the result
        ) {
            // then don't calculat fortune/misfortune because it's either a single normal die or a weird roll that either I can't assume the rules for or the system won't allow
            return;
        }

        const mod = modifiers[0] || '';
        if (mod.includes('dh') || mod.includes('kl')) {
            options.misfortuneCount += (totalThrown - 1);
        }
        else if (mod.includes('kh') || mod.includes('dl')) {
            options.fortuneCount += (totalThrown - 1);
        }
    }

    if (options.fortuneCount === options.misfortuneCount) {
        return;
    }

    const qty = Settings.fortuneStacks
        ? Math.abs(options.fortuneCount - options.misfortuneCount) + 1
        : 2;

    if (options.fortuneCount > options.misfortuneCount) {
        options.dice = `${qty}d20kh`;
    }
    else if (options.misfortuneCount > options.fortuneCount) {
        options.dice = `${qty}d20kl`;
    }
};

const handleInitiative = (actor, formula) => {
    formula ||= '1d20';

    /** BEGIN OVERRIDE */
    // this gets the original formula before "extra" stuff that's this base method adds in case something else is wrapping this method
    formula = formula.split('@attributes.init.total[')[0];

    if (actor?.items?.size) {
        const options = {
            dice: formula,
            fortuneCount: 0,
            misfortuneCount: 0,
        };

        const count = countBFlags(actor.items, fortune, misfortune, initFortune, initMisfortune, initWarsightFortune);

        options.fortuneCount += count[fortune];
        options.misfortuneCount += count[misfortune];

        options.fortuneCount += count[initFortune];
        options.misfortuneCount += count[initMisfortune];

        if (count[initWarsightFortune]) {
            options.fortuneCount += 2;
        }

        handleFortune(options);
        formula = options.dice;
    }
    /** END OVERRIDE */

    const defaultParts = [formula, `@attributes.init.total[${game.i18n.localize("PF1.Initiative")}]`];
    if (actor && game.settings.get("pf1", "initiativeTiebreaker"))
        defaultParts.push(`(@attributes.init.total / 100)[${game.i18n.localize("PF1.Tiebreaker")}]`);
    const parts = CONFIG.Combat.initiative.formula ? CONFIG.Combat.initiative.formula.split(/\s*\+\s*/) : defaultParts;
    if (!actor) return parts[0] || "0";
    return parts.filter((p) => p !== null).join(" + ");
};

Hooks.once('setup', () => libWrapper.register(MODULE_NAME, 'pf1.documents.CombatPF.prototype._getInitiativeFormula', handleInitiative, libWrapper.OVERRIDE));

// item use does not fire through this hook, so it needs its own dice handling below
Hooks.on(localHooks.d20Roll, (options) => handleFortune(options));

Hooks.on(localHooks.itemUse, (item, options) => {
    options.fortuneCount ||= 0;
    options.misfortuneCount ||= 0;

    if (item.hasItemBooleanFlag(selfFortune)) {
        options.fortuneCount++;
    }
    else if (item.hasItemBooleanFlag(selfMisfortune)) {
        options.misfortuneCount++;
    }

    const action = options.actionID ? item.actions.get(options.actionID) : item.firstAction;
    let rangeFortune = attackFortune;
    let rangeMisfortune = attackMisfortune;
    if (['touch', 'melee', 'reach'].includes(action.data.range.units)) {
        rangeFortune += '_melee';
        rangeMisfortune += '_melee';
    }
    else {
        rangeFortune += '_ranged';
        rangeMisfortune += '_ranged';
    }

    const count = countBFlags(item.parent?.items, fortune, misfortune, attackFortune, attackMisfortune, rangeFortune, rangeMisfortune);

    options.fortuneCount += count[fortune];
    options.misfortuneCount += count[misfortune];

    options.fortuneCount += count[attackFortune];
    options.misfortuneCount += count[attackMisfortune];

    options.fortuneCount += count[rangeFortune];
    options.misfortuneCount += count[rangeMisfortune];

    handleFortune(options);
});

Hooks.on('pf1PreActorRollSkill', (actor, options, skillId) => {
    let fortuneCount = 0;
    let misfortuneCount = 0;

    const count = countBFlags(actor?.items, fortune, misfortune, skillFortune, skillMisfortune, `${skillFortune}_${skillId}`, `${skillMisfortune}_${skillId}`);

    fortuneCount += count[fortune];
    misfortuneCount += count[misfortune];
    fortuneCount += count[skillFortune];
    misfortuneCount += count[skillMisfortune];

    fortuneCount += count[`${skillFortune}_${skillId}`];
    misfortuneCount += count[`${skillMisfortune}_${skillId}`];

    options.fortuneCount = fortuneCount;
    options.misfortuneCount = misfortuneCount;;
});

Hooks.on('pf1PreActorRollAttack', (actor, options) => {
    let fortuneCount = 0;
    let misfortuneCount = 0;

    let rangeFortune = attackFortune;
    let rangeMisfortune = attackMisfortune;
    if (options.melee) {
        rangeFortune += '_melee';
        rangeMisfortune += '_melee';
    }
    else {
        rangeFortune += '_ranged';
        rangeMisfortune += '_ranged';
    }

    const count = countBFlags(actor?.items, fortune, misfortune, attackFortune, attackMisfortune, rangeFortune, rangeMisfortune);

    fortuneCount += count[fortune];
    misfortuneCount += count[misfortune];
    fortuneCount += count[attackFortune];
    misfortuneCount += count[attackMisfortune];
    fortuneCount += count[rangeFortune];
    misfortuneCount += count[rangeMisfortune];

    options.fortuneCount = fortuneCount;
    options.misfortuneCount = misfortuneCount;;
});

Hooks.on('pf1PreActorRollBab', (actor, options) => {
    let fortuneCount = 0;
    let misfortuneCount = 0;

    const count = countBFlags(actor?.items, fortune, misfortune, babFortune, babMisfortune);

    fortuneCount += count[fortune];
    misfortuneCount += count[misfortune];
    fortuneCount += count[babFortune];
    misfortuneCount += count[babMisfortune];

    options.fortuneCount = fortuneCount;
    options.misfortuneCount = misfortuneCount;;
});

Hooks.on('pf1PreActorRollCl', (actor, bookId, options) => {
    let fortuneCount = 0;
    let misfortuneCount = 0;

    const name = options.rollData.spells[bookId].name;
    const ids = Object.entries(options.rollData.spells)
        .filter(([_id, value]) => value.name === name)
        .map(([id, _value]) => id);

    const idFortunes = ids.map((id) => `${clFortune}_${id}`);
    const idMisfortunes = ids.map((id) => `${clMisfortune}_${id}`);

    const count = countBFlags(actor?.items, fortune, misfortune, clFortune, clMisfortune, ...idFortunes, ...idMisfortunes);

    fortuneCount += count[fortune];
    misfortuneCount += count[misfortune];
    fortuneCount += count[clFortune];
    misfortuneCount += count[clMisfortune];

    idFortunes.forEach((id) => fortuneCount += count[id]);
    idMisfortunes.forEach((id) => misfortuneCount += count[id]);

    options.fortuneCount = fortuneCount;
    options.misfortuneCount = misfortuneCount;;
});

Hooks.on('pf1PreActorRollConcentration', (actor, options, bookId) => {
    let fortuneCount = 0;
    let misfortuneCount = 0;

    const name = options.rollData.spells[bookId].name;
    const ids = Object.entries(options.rollData.spells)
        .filter(([_id, value]) => value.name === name)
        .map(([id, _value]) => id);

    const idFortunes = ids.map((id) => `${concentrationFortune}_${id}`);
    const idMisfortunes = ids.map((id) => `${concentrationMisfortune}_${id}`);

    const count = countBFlags(actor?.items, fortune, misfortune, concentrationFortune, concentrationMisfortune, ...idFortunes, ...idMisfortunes);

    fortuneCount += count[fortune];
    misfortuneCount += count[misfortune];
    fortuneCount += count[concentrationFortune];
    misfortuneCount += count[concentrationMisfortune];

    idFortunes.forEach((id) => fortuneCount += count[id]);
    idMisfortunes.forEach((id) => misfortuneCount += count[id]);

    options.fortuneCount = fortuneCount;
    options.misfortuneCount = misfortuneCount;;
});

const handleAbility = (actor, options, ability) => {
    let fortuneCount = 0;
    let misfortuneCount = 0;

    const count = countBFlags(actor?.items, fortune, misfortune, abilityFortune, abilityMisfortune, `${abilityFortune}_${ability}`, `${abilityMisfortune}_${ability}`);

    fortuneCount += count[fortune];
    misfortuneCount += count[misfortune];
    fortuneCount += count[abilityFortune];
    misfortuneCount += count[abilityMisfortune];

    fortuneCount += count[`${abilityFortune}_${ability}`];
    misfortuneCount += count[`${abilityMisfortune}_${ability}`];

    options.fortuneCount = fortuneCount;
    options.misfortuneCount = misfortuneCount;;
};
// Hooks.on('pf1PreActorRollAbility', handleAbility); // does not work in 0.82.5
Hooks.on(localHooks.rollAbilityTest, (actor, abilityId, options) => handleAbility(actor, options, abilityId));

const handleCmb = (actor, options) => {
    let fortuneCount = 0;
    let misfortuneCount = 0;

    const count = countBFlags(actor?.items, fortune, misfortune, attackFortune, attackMisfortune, babFortune, babMisfortune);

    fortuneCount += count[fortune];
    misfortuneCount += count[misfortune];
    fortuneCount += count[attackFortune];
    misfortuneCount += count[attackMisfortune];
    fortuneCount += count[babFortune];
    misfortuneCount += count[babMisfortune];

    options.fortuneCount = fortuneCount;
    options.misfortuneCount = misfortuneCount;;
};
// Hooks.on('pf1PreActorRollCmb', handleCmb); // does not work in 0.82.5
Hooks.on(localHooks.rollCMB, handleCmb);

const handleSavingThrow = (actor, options, savingThrowId) => {
    let fortuneCount = 0;
    let misfortuneCount = 0;

    const count = countBFlags(actor?.items, fortune, misfortune, saveFortune, saveMisfortune, `${saveFortune}_${savingThrowId}`, `${saveMisfortune}_${savingThrowId}`);

    fortuneCount += count[fortune];
    misfortuneCount += count[misfortune];
    fortuneCount += count[saveFortune];
    misfortuneCount += count[saveMisfortune];

    fortuneCount += count[`${saveFortune}_${savingThrowId}`];
    misfortuneCount += count[`${saveMisfortune}_${savingThrowId}`];

    options.fortuneCount = fortuneCount;
    options.misfortuneCount = misfortuneCount;;
};
// Hooks.on('pf1PreActorRollSave', handleSavingThrow); // does not work in 0.82.5
Hooks.on(localHooks.rollSavingThrow, (actor, savingThrowId, options) => handleSavingThrow(actor, options, savingThrowId));
