let socket;

Hooks.once("socketlib.ready", () => {
    socket = socketlib.registerModule("ckl-heal-friendly-targets");
    socket.register("updateActors", updateActors);
});

async function updateActors(updates, amount) {
    if (updates?.length) {
        await Actor.updateDocuments(updates);

        const ids = updates.map(x => x._id);
        const actors = game.actors.filter(x => ids.includes(x.id));

        let chatOptions = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            content: `Automatically healed for [[${amount}[positive]]]: ${actors.map(x => x.name).join(', ')}`
        };
        ChatMessage.create(chatOptions);
    }
}

const self = (me) => typeof me === 'function' ? me() : me;

const ifDebug = (func) => {
    // todo read game setting
    if (false) {
        return self(func);
    }
};

Hooks.once('ready', () => {
    Hooks.on('itemUse', async (item, type, etc) => {
        if (type === 'attack') {
            ifDebug(() => console.log('************** itemUse hook ********************', item, type, etc));
        }
        if (type === 'postAttack') {
            ifDebug(() => console.log('******************* postAttack hook *********************', item, type, etc));
            if (item.isHealing) {
                const healed = etc.templateData.attacks[0]?.damage.total;
                if (!healed) {
                    return;
                }

                const myDisposition = item.actor.getActiveTokens()?.[0]?.data.disposition ?? 0;

                let { targets } = etc.templateData;
                targets = targets.filter(t => !myDisposition || targets.length === 1 || myDisposition === t.tokenData.disposition);
                const updates = targets?.map((target) => {
                    const currentHp = target.actorData.data.attributes.hp.value;
                    const maxHp = target.actorData.data.attributes.hp.max;
                    const newHp = Math.min(currentHp + healed, maxHp);
                    return { _id: target.actorData._id, 'data.attributes.hp.value': newHp };
                })
                if (updates?.length) {
                    await socket.executeAsGM('updateActors', updates, healed);
                }
            }
        }
    });
});
