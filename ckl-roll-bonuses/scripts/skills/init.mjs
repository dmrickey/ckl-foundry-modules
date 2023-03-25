import { CONFIG_BUTTON } from '../consts.mjs';
import { CklSkillConfig } from './ckl-skill-config.mjs';
import { CklSkillData } from './ckl-skill-data.mjs';

const createSkillButton = (id) => {
    const node = document.createElement('a');
    node.id = id;
    node.style = 'line-height: 1.5rem; width: 1.5rem;';
    node.innerHTML = CONFIG_BUTTON;
    return node;
}

Hooks.on('renderActorSheetPF', (app, html, data) => {
    if (!app._skillsLocked) {
        return;
    }

    // add skill config button
    setTimeout(() => {
        html.find('.tab.skills .skill-lock-button').each((_, btn) => {
            const id = 'ckl-skill-config';
            const button = createSkillButton(id);
            button.addEventListener(
                'click',
                async () => await CklSkillConfig.showSkillConfigDialog(data.actor)
            );

            const parent = btn.parentElement;

            parent.removeChild(btn);
            const column = document.createElement('div');
            const lh = game.modules.get('koboldworks-pf1-little-helper')?.active ? ' flex-direction: column;' : '';
            column.style = `flex: unset; display: flex; align-items: center; justify-content: center; text-align: center;${lh}`;
            column.appendChild(button);

            btn.style = 'padding: unset;';
            column.appendChild(btn);

            parent.appendChild(column);
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
        const button = createSkillButton(id);
        button.addEventListener(
            'click',
            async () => await CklSkillData.showSkillDataDialog(data.actor, skillId)
        );

        controls.appendChild(button);
    });
});

// grouped skills (Artistry, Craft, Lore, Perform, Perfession) have a compound id and it's simpler to just lump them under their main "group"
const getSkillId = (id) => id.includes('.') ? id.split('.')[0] : id;

Hooks.on('pf1PreActorRollSkill', (actor, options, skillId) => {
    skillId = getSkillId(skillId);

    const data = CklSkillData.getSkillData(actor, skillId);
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

// todo pf1 0.82.6
// todo no way to know which actor prompted the dialog so it's impossible to do in any sane way right now
Hooks.on('renderApplication', (app, html, data) => {
    // if (app.options.subject?.skill === undefined) {
    //     return;
    // }

    // const dialog = html[0];
    // dialog.style.height = 'unset';

    // const lastRow = dialog.querySelector(".dialog-content .form-group:last-child");
    // if (!lastRow) {
    //     return;
    // }

    // const label = document.createElement('label');
    // label.innerText = localize('skills.inspiration');

    // const input = document.createElement('input');
    // input.type = 'checkbox';
    // // input.checked = <is inspiration checked for this skill?>

    // // create hint text that shows what inspiration is
    // const text = document.createElement('div');
    // // CklSkillConfig.loadInspiration(actor)
    // text.innerText = 'inspiration die value from actor';

    // const node = document.createElement('div');
    // node.classList.add('form-group');

    // node.appendChild(label);
    // node.appendChild(input);
    // node.appendChild(text);

    // lastRow.parentElement.appendChild(node);
});

// Hooks.once('pf1.postReady', () => {
//     // libWrapper.register(MODULE_NAME, 'pf1.DicePF.d20Roll', function (wrapped, skillId, options) {
//     libWrapper.register(MODULE_NAME, 'pf1.documents.ActorPF.prototype.rollSkill', function (wrapped, skillId, options) {

//         let result = wrapped(...args);

//         if (result) {
//             // remove key
//         }

//         return result;
//     }, 'WRAPPER');
// });
