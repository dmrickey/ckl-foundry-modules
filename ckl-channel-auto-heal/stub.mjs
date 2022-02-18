const self = (me) => typeof me === 'function' ? me() : me;

const ifDebug = (func) => {
    // todo read game setting
    // eslint-disable-next-line
    if (true) {
        return self(func);
    }
};

Hooks.once('ready', () => {
    Hooks.on('itemUse', async (item, type, etc) => {
        if (type === 'attack') {
            // ifDebug(() => console.log('************** itemUse hook ********************', item, type, etc));
        }
        if (type === 'postAttack') {
            // ifDebug(() => console.log('******************* postAttack hook *********************', item, type, etc));
            if (item.name.toLowerCase() === 'channel energy' && etc.ev?.caught !== true) {
                if (item.isHealing) {
                    // todo get this amount better
                    const healed = etc.chatData["flags.pf1.metadata"].rolls.attacks[0].damage[0].roll.total;
                    const applyMutation = async (target) => {
                        // todo verify if actor can receive healing (i.e. not undead)
                        const currentHp = target.actorData.data.attributes.hp.value;
                        const maxHp = target.actorData.data.attributes.hp.max;
                        const newHp = Math.min(currentHp + healed, maxHp);
                        await warpgate.mutate(target.tokenData.document, { actor: { 'data.attributes.hp.value': newHp } });
                    };

                    const targets = etc.templateData.targets;
                    if (targets) {
                        await Promise.all(targets.map(applyMutation));
                    }
                }

                if (item.hasTemplate) {
                    canvas.scene.templates.get(etc.chatData["flags.pf1.metadata"].template).delete();
                }
            }
        }
    });
});