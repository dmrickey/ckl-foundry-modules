// https://www.d20pfsrd.com/classes/core-classes/bard/#Versatile_Performance_Ex

import { MODULE_NAME } from "../consts.mjs";
import { getDocDFlags } from "../util/flag-helpers.mjs";
import { registerItemHint } from "../util/item-hints.mjs";
import { localize } from "../util/localize.mjs";

const key = 'versatile-performance';

registerItemHint((hintcls, actor, item, _data) => {
    if (!(item instanceof pf1.documents.item.ItemFeatPF)) return;
    const vps = getDocDFlags(item, key);

    const hints = [];

    for (let i = 0; i < vps.length; i++) {
        const [base, ...substitutes] = `${vps[i]}`.split(';').map(x => x.trim());
        const baseName = actor.getSkillInfo(base).name;
        const skills = substitutes.map((id) => actor.getSkillInfo(id).name).join(', ');
        const hint = hintcls.create(localize('versatilePerformance.hint', { base: baseName, skills }), [], {});
        hints.push(hint);
    }

    return hints;
});

/**
 *
 * @param {*} baseSkill
 * @returns {HTMLElement}
 */
function createVPIcon(baseSkill) {
    const i = document.createElement('i');
    i.classList.add('fas', 'fa-music');
    i.style.marginInlineStart = 'auto';
    i.style.marginInlineEnd = '0.25rem';
    i.style.alignSelf = 'center';

    const tip = localize('versatilePerformance.skillTip', { base: baseSkill.name });
    i.setAttribute('data-tooltip', tip);
    i.setAttribute('data-tooltip-direction', 'UP');
    return i;
}

Hooks.on('renderActorSheetPF', (
    /** @type {{ _skillsLocked: boolean; }} */ app,
    /** @type {{ find: (arg0: string) => { (): any; new (): any; each: { (arg0: { (_: any, element: HTMLElement): void; }): void; new (): any; }; }; }} */ html,
    /** @type {{ actor: ActorPF; }} */ { actor }
) => {
    const vps = getDocDFlags(actor, key);

    if (!vps.length) return;

    html.find('.tab.skills .skills-list li.skill, .tab.skills .skills-list li.sub-skill').each((_, li) => {
        const getSkillId = () => {
            const skillId = li.getAttribute('data-skill');
            const mainId = li.getAttribute('data-main-skill');
            return mainId
                ? `${mainId}.subSkills.${skillId}`
                : skillId;
        }

        const skillId = getSkillId();
        if (!skillId) return;

        vps.forEach((vp) => {
            const [baseId, ...targetIds] = `${vp}`.split(';');
            if (!targetIds.includes(skillId)) return;

            const icon = createVPIcon(actor.getSkillInfo(baseId));
            const name = li.querySelector('.skill-name');
            name?.appendChild(icon);
        });
    });
});

/**
 * @param {(skillId: string) => any} wrapped
 * @param {string} skillId
 * @param {Object} _options
 * @this {ActorPF}
 * @returns {ChatMessagePF|object|void} The chat message if one was created, or its data if not. `void` if the roll was cancelled.
 */
function versatileRollSkill(wrapped, skillId, _options) {
    const vps = getDocDFlags(this, key);

    for (let i = 0; i < vps.length; i++) {
        const [base, ...substitutes] = `${vps[i]}`.split(';').map(x => x.trim());

        if (substitutes.includes(skillId)) {
            const baseName = this.getSkillInfo(base).name;

            Hooks.once('preCreateChatMessage', (
                /** @type {ChatMessagePF}*/ doc,
                /** @type {object}*/ _data,
                /** @type {object}*/ _options,
                /** @type {string}*/ _userId,
            ) => {
                const { content } = doc;
                const currentTitle = content.split('\r\n')[1];
                const name = this.getSkillInfo(skillId).name;
                const updatedTitle = localize('PF1.SkillCheck', { skill: name });
                const vpTitle = localize('versatilePerformance.title', { skill: baseName });
                doc.updateSource({ content: doc.content.replace(currentTitle, `  ${updatedTitle}<br />  ${vpTitle}`) });
            });
            return wrapped(base);
        }
    }

    return wrapped(skillId);
}

Hooks.once('setup', () => {
    libWrapper.register(MODULE_NAME, 'pf1.documents.actor.ActorPF.prototype.rollSkill', versatileRollSkill, libWrapper.WRAPPER);
});
