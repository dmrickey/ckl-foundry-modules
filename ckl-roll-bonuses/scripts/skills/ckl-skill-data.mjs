import { MODULE_NAME } from "../consts.mjs";
import { localize, localizeFull } from "../util/localize.mjs";

export class CklSkillData {
    constructor({ inspiration, dice, bonus }) {
        this.inspiration = inspiration;
        this.dice = dice;
        this.bonus = bonus;
    }

    get configured() {
        return !!(this.inspiration || this.dice || this.bonus);
    }

    static getSkillData = (actor, skillId) => new CklSkillData(actor.getFlag(MODULE_NAME, skillId) || {});
    static setSkillData = async (actor, skillId, data) => await actor.setFlag(MODULE_NAME, skillId, data);

    static async showSkillDataDialog(actor, skillId) {
        const data = this.getSkillData(actor, skillId);
        const buttons = [
            { label: localizeFull('PF1.Cancel'), value: false },
            { label: localize('ok'), value: true },
        ];
        const inputs = [{
            label: localizeFull('PF1.BaseDice'),
            type: 'text',
            options: data.dice ?? '',
        }, {
            label: localizeFull('PF1.Bonus'),
            type: 'text',
            options: data.bonus ?? '',
        }, {
            label: localize('skills.inspiration'),
            type: 'checkbox',
            options: data.inspiration ? 'checked' : false,
        }];

        const title = pf1.config.skills[skillId];
        const { inputs: output, buttons: result } = await warpgate.menu({ buttons, inputs }, { title });
        if (result) {
            const bonus = output[1]?.trim() || '';
            const dice = output[0]?.trim() || '';
            const inspiration = output[2] || false;

            // todo verify validity of input bonus / dice

            await this.setSkillData(actor, skillId, {
                bonus,
                dice,
                inspiration,
            })
        }
    }
}
