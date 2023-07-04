// https://www.d20pfsrd.com/classes/core-classes/bard/#Versatile_Performance_Ex

import { MODULE_NAME } from "../consts.mjs";
import { getDocDFlags } from "../util/flag-helpers.mjs";
import { registerItemHint } from "../util/item-hints.mjs";
import { localize } from "../util/localize.mjs";

const key = 'versatile-performance';
const disabledKey = (
    /** @type {string} */ baseId,
    /** @type {string} */ skillId,
) => `vp_disable_${baseId}_${skillId}`;

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
 * @param {ActorPF} actor
 * @param {string} baseId
 * @param {string} skillId
 * @returns {HTMLElement}
 */
function createVPIcon(actor, baseId, skillId) {
    const baseSkill = actor.getSkillInfo(baseId);

    const disabled = actor.getFlag(MODULE_NAME, disabledKey(baseId, skillId));

    const icon = document.createElement('a');
    icon.classList.add('fas', disabled ? 'fa-music-slash' : 'fa-music');
    icon.style.marginInlineStart = 'auto';
    icon.style.width = '1.5rem';
    icon.style.alignSelf = 'center';
    icon.style.textAlign = 'center';

    const tip = localize('versatilePerformance.skillTip', { base: baseSkill.name, enabled: localize(disabled ? 'PF1.Disabled' : 'PF1.Enabled') });
    icon.setAttribute('data-tooltip', tip);
    icon.setAttribute('data-tooltip-direction', 'UP');

    icon.addEventListener(
        'click',
        () => actor.setFlag(MODULE_NAME, disabledKey(baseId, skillId), !disabled),
    );
    return icon;
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

            const icon = createVPIcon(actor, baseId, skillId);
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
        const [baseId, ...substitutes] = `${vps[i]}`.split(';').map(x => x.trim());

        if (substitutes.includes(skillId) && !this.getFlag(MODULE_NAME, disabledKey(baseId, skillId))) {
            const baseName = this.getSkillInfo(baseId).name;

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
            return wrapped(baseId);
        }
    }

    return wrapped(skillId);
}

Hooks.once('setup', () => {
    libWrapper.register(MODULE_NAME, 'pf1.documents.actor.ActorPF.prototype.rollSkill', versatileRollSkill, libWrapper.WRAPPER);
});
