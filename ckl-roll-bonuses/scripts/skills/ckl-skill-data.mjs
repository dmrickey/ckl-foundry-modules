import { MODULE_NAME } from "../consts.mjs";

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

            await this.setSkillData(actor, skillId, {
                bonus,
                dice,
                inspiration,
            })
        }
    }
}
