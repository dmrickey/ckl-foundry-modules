Hooks.once('init', () => console.log('ckl roll bonuses loaded'));

const MODULE_NAME = 'ckl-roll-bonuses';
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

class CklSkillConfig {
    constructor({ inspiration } = { inspiration: '1d6[Inspiration]' }) {
        this.inspiration = inspiration?.trim() || '1d6[Inspiration]';
    }

    static loadInspiration = (actor) => new CklSkillConfig(actor.getFlag(MODULE_NAME, inspiriationDieKey)).inspiration;
}

const getSkillData = (actor, skillId) => new CklSkillData(actor.getFlag(MODULE_NAME, skillId) || {});
const setSkillData = async (actor, skillId, data) => await actor.setFlag(MODULE_NAME, skillId, data);

const getSkillConfig = (actor) => new CklSkillConfig(actor.getFlag(MODULE_NAME, inspiriationDieKey) || new CklSkillConfig());
const setSkillConfig = async (actor, config) => await actor.setFlag(MODULE_NAME, inspiriationDieKey, config);

Hooks.on('renderActorSheetPF', (app, html, data) => {
    // add skill config button
    html.find('.tab.skills .skill-lock-button').each((_, btn) => {
        const node = document.createElement('a');
        const id = 'ckl-skill-config';
        node.id = id;
        node.style = 'flex: unset;';
        node.innerHTML = '<i class="ra ra-cog ra-fw"></i>';
        btn.parentElement.insertBefore(node, btn);
        setTimeout(() => {
            const tag = document.querySelector(`#${id}`);
            tag.addEventListener(
                'click',
                async () => await showGlobalSkillConfig(data.actor)
            );
        });
    });

    // add skill data buttons
    html.find('.tab.skills .skills-list li.skill').each((_, li) => {
        let controls = li.querySelector('.skill-controls');
        if (!controls) {
            controls = document.createElement('div');
            controls.className = 'skill-controls';
            li.appendChild(controls);
        }

        const skillId = li.getAttribute('data-main-skill') || li.getAttribute('data-skill');
        const id = `ckl-skill-${skillId}`
        const node = document.createElement('a');
        node.id = id;
        node.innerHTML = '<i class="ra ra-cog ra-fw"></i>';
        controls.appendChild(node);

        setTimeout(() => {
            const tag = document.querySelector(`#${id}`);
            tag.addEventListener(
                'click',
                async () => await showSkillOptions(data.actor, skillId)
            );
        });
    });
});

const getSkillId = (id) => id.includes('.') ? id.split('.')[0] : id;

Hooks.on('actorRoll', (actor, type, skillId, options) => {
    if (type !== 'skill') {
        return;
    }

    skillId = getSkillId(skillId);

    const data = getSkillData(actor, skillId);
    if (!data.configured) {
        return;
    }

    if (data.bonus) {
        options.bonus = options.bonus
            ? `${options.bonus} + ${data.bonus}`
            : data.bonus;
    }

    if (data.inspiration) {
        const insp = CklSkillConfig.loadInspiration(actor);
        options.bonus = options.bonus
            ? `${options.bonus} + ${insp}`
            : insp;
    }

    if (data.dice) {
        options.dice = data.dice;
    }
});

async function showSkillOptions(actor, skillId) {
    const data = getSkillData(actor, skillId);
    const buttons = [
        { label: 'Canel', value: false },
        { label: 'OK', value: true },
    ];
    const inputs = [{
        label: 'Base Dice', // use pf1 lang key
        type: 'text',
        options: data.dice ?? '',
    }, {
        label: 'Bonus',
        type: 'text',
        options: data.bonus ?? '',
    }, {
        label: 'Inspiration',
        type: 'checkbox',
        options: data.inspiration ? 'checked' : false,
    }];

    const title = game.pf1.config.skills[skillId];
    const { inputs: output, buttons: result } = await warpgate.menu({ buttons, inputs }, { title });
    if (result) {
        const bonus = output[1]?.trim() || '';
        const dice = output[0]?.trim() || '';
        const inspiration = output[2] || false;

        // todo verify validity of bonus / dice

        await setSkillData(actor, skillId, {
            bonus,
            dice,
            inspiration,
        })
    }
}

async function showGlobalSkillConfig(actor) {
    const buttons = [
        { label: 'Canel', value: false },
        { label: 'OK', value: true },
    ];
    const inputs = [{
        label: 'Inspiration',
        type: 'text',
        options: CklSkillConfig.loadInspiration(actor),
    }];
    const { inputs: output, buttons: result } = await warpgate.menu({ buttons, inputs }, { title: 'Skill Config' });
    if (result) {
        const inspiration = output[0].trim() || '1d6[Inspiration]';
        await setSkillConfig(actor, { inspiration });
    }
}

// todo figure out if anything is needed to make it work with custom skills
