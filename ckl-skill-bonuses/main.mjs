Hooks.once('init', () => console.log('ckl skill bonuses loaded'));

const MODULE_NAME = 'ckl-skill-bonuses';
const inspiriationDieKey = 'inspiriationDie';

class CklSkillData {
    constructor({ inspiration, dice, bonus }) {
        this.inspiration = inspiration;
        this.dice = dice;
        this.bonus = bonus;
    }

    get configured() {
        return !!(this.inspiration || this.dice || this.bonus);
    }
}

// todo ensure this hook only runs on the client that used the skill
Hooks.on('actorRoll', (actor, type, skillId, options) => {
    if (type !== 'skill') {
        return;
    }

    // might have to be actor.document or maybe actor.data.getFlag
    const data = new CklSkillData(actor.getFlag(MODULE_NAME, skillId) || {});
    if (!data.configured) {
        return;
    }

    if (data.bonus) {
        options.bonus = options.bonus
            ? `${options.bonus} + ${data.bonus}`
            : data.bonus;
    }

    if (data.inspiration) {
        const insp = actor.getFlag(MODULE_NAME, inspiriationDieKey) || '1d6[Inspiration]';
        options.bonus = options.bonus
            ? `${options.bonus} + ${insp}`
            : insp;
    }

    if (data.dice) {
        options.dice = data.dice;
    }
});

// todo create input for "global setting" (i.e. configure inspiration die)
// todo create individual input for each setting
// todo add a button each skill that pops up that form
// todo figure out if anything is needed to make it work with custom skills
