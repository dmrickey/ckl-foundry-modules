let socket;

const MODULE_NAME = 'ckl-heal-friendly-targets';

Hooks.once("socketlib.ready", () => {
    socket = socketlib.registerModule(MODULE_NAME);
    socket.register("updateActors", updateActors);
});

async function updateActors(data, updates, amountHealed) {
    if (updates?.length) {
        await Actor.updateDocuments(updates);

        const ids = updates.map(x => x._id);
        const actors = game.actors.filter(x => ids.includes(x.id));
        const targets = actors.map(x => x.name).join(', ');
        const content = game.i18n.format(
            `${MODULE_NAME}.healCardDescription`,
            { amountHealed, targets },
        );

        let chatOptions = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            content,
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
                const data = targets?.map((target) => {
                    const currentHp = target.actorData.data.attributes.hp.value;
                    const maxHp = target.actorData.data.attributes.hp.max;
                    const newHp = Math.min(currentHp + healed, maxHp);
                    return { id: target.actorData._id, currentHp, newHp };
                }) ?? [];
                const updates = data.map(({ id, newHp }) => ({ _id: id, newHp }));
                // });
                if (updates?.length) {
                    await socket.executeAsGM('updateActors', data, updates, healed);
                }
            }
        }
    });
});
