import { MODULE_NAME } from "../consts.mjs";

export class CklSkillConfig {
    static _inspiriationDieKey = 'inspiriationDie';

    constructor({ inspiration } = { inspiration: '1d6[Inspiration]' }) {
        this.inspiration = inspiration?.trim() || '1d6[Inspiration]';
    }

    static getSkillConfig = (actor) => new CklSkillConfig(actor.getFlag(MODULE_NAME, this._inspiriationDieKey) || new CklSkillConfig());
    static loadInspiration = (actor) => this.getSkillConfig(actor).inspiration;
    static setSkillConfig = async (actor, config) => await actor.setFlag(MODULE_NAME, this._inspiriationDieKey, config);

    static async showSkillConfigDialog(actor) {
        const buttons = [
            { label: 'Canel', value: false },
            { label: 'OK', value: true },
        ];
        const inputs = [{
            label: 'Inspiration',
            type: 'text',
            options: this.loadInspiration(actor),
        }];
        const { inputs: output, buttons: result } = await warpgate.menu({ buttons, inputs }, { title: 'Skill Config' });
        if (result) {
            const inspiration = output[0].trim() || '1d6[Inspiration]';

            // todo validate formula

            await this.setSkillConfig(actor, { inspiration });
        }
    }
}
