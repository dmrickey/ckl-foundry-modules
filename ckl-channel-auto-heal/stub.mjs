let socket;

Hooks.once("socketlib.ready", () => {
    socket = socketlib.registerModule("ckl-channel-auto-heal");
    socket.register("updateActors", updateActors);
});

async function updateActors(updates) {
    if (updates?.length) {
        await Actor.updateDocuments(updates);
    }
}

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
            if (item.name.toLowerCase().includes('channel energy') && etc.ev?.caught !== true) {
                if (item.isHealing) {
                    const healed = etc.templateData.attacks[0]?.damage.total;
                    if (!healed) {
                        return;
                    }

                    const targets = etc.templateData.targets;
                    const updates = targets?.map((target) => {
                        const currentHp = target.actorData.data.attributes.hp.value;
                        const maxHp = target.actorData.data.attributes.hp.max;
                        const newHp = Math.min(currentHp + healed, maxHp);
                        return { _id: target.actorData._id, 'data.attributes.hp.value': newHp };
                    })
                    if (updates?.length) {
                        await socket.executeAsGM('updateActors', updates);
                    }
                }

                if (item.hasTemplate) {
                    canvas.scene.templates.get(etc.chatData["flags.pf1.metadata"].template).delete();
                }
            }
        }
    });
});
