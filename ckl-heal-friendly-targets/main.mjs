let socket;

const MODULE_NAME = 'ckl-heal-friendly-targets';

const getFirstActiveGM = () => game.users.activeGM;
const isFirstGM = () => getFirstActiveGM() === game.user;

// Hooks.once("socketlib.ready", () => {
//     socket = socketlib.registerModule(MODULE_NAME);
//     socket.register("updateActors", updateActors);
// });

// async function updateActors(data, updates, amountHealed) {
//     if (updates?.length) {
//         await Actor.updateDocuments(updates);

//         const ids = updates.map(x => x._id);
//         const actors = game.actors.filter(x => ids.includes(x.id));
//         const targets = actors.map(x => x.name).join(', ');
//         const content = game.i18n.format(
//             `${MODULE_NAME}.healCardDescription`,
//             { amountHealed, targets },
//         );

//         let chatOptions = {
//             user: game.user._id,
//             speaker: ChatMessage.getSpeaker(),
//             content,
//         };
//         ChatMessage.create(chatOptions);
//     }
// }

const self = (me) => typeof me === 'function' ? me() : me;

const ifDebug = (func) => {
    // todo read game setting
    if (false) {
        return self(func);
    }
};

// Hooks.on('itemUse', async (item, type, etc) => {
//     if (type === 'attack') {
//         ifDebug(() => console.log('************** itemUse hook ********************', item, type, etc));
//     }
//     if (type === 'postAttack') {
//         ifDebug(() => console.log('******************* postAttack hook *********************', item, type, etc));
//         if (item.isHealing) {
//             const healed = etc.templateData.attacks[0]?.damage.total;
//             if (!healed) {
//                 return;
//             }

//             const myDisposition = item.actor?.getActiveTokens()?.[0]?.data.disposition ?? 0;

//             let { targets } = etc.templateData;
//             targets = targets.filter(t => !myDisposition || targets.length === 1 || myDisposition === t.tokenData.disposition);
//             const data = targets?.map((target) => {
//                 const currentHp = target.actorData.data.attributes.hp.value;
//                 const maxHp = target.actorData.data.attributes.hp.max;
//                 const newHp = Math.min(currentHp + healed, maxHp);
//                 return { id: target.actorData._id, currentHp, newHp };
//             }) ?? [];
//             const updates = data.map(({ id, newHp }) => ({ _id: id, newHp }));
//             // });
//             if (updates?.length) {
//                 await socket.executeAsGM('updateActors', data, updates, healed);
//             }
//         }
//     }
// });

Hooks.on('createChatMessage', async (doc, _options, userId) => {
    if (!isFirstGM()) {
        return;
    }

    // const targets = doc.targets; // bugged in pf1 9.4
    const targetIds = doc.flags?.pf1?.metadata?.targets ?? [];
    const targets = canvas.tokens.placeables.filter((o) => targetIds.includes(o.id));
    const item = doc.itemSource;
    const action = item?.actions.get(doc.flags?.pf1?.metadata?.action);
    const attacks = doc.flags?.pf1?.metadata?.rolls?.attacks;
    const isHealing = action?.isHealing;

    ifDebug(() => {
        console.log('Checking chat card for Heal Friendly Targets');
        console.log(' - targets:', targets.map(x => x.id));
        console.log(' - item:', item);
        console.log(' - action:', action);
        console.log(' - isHealing:', isHealing);
    })

    if (!targets?.length || !action || !attacks?.length || !isHealing) {
        ifDebug(() => console.log(' - failed check, this is not healing, there was nothing rolled, or there were no targets'));
        return;
    }

    const mod = isHealing ? -1 : 1;

    const total = attacks
        .flatMap((attack) => attack.damage)
        .map((damage) => damage.total)
        .reduce((acc, curr) => acc + curr, 0);

    ifDebug(() => console.log(` - healint targets for [[${total}]]`));
    await pf1.documents.actor.ActorPF.applyDamage(total * mod, { targets });

    const content = game.i18n.format(
        `${MODULE_NAME}.healCardDescription`,
        { amountHealed: total, targets: targets.map(x => x.name).join(', ') },
    );

    const chatOptions = {
        user: userId,
        speaker: doc.speaker,
        content,
    };
    ChatMessage.create(chatOptions);
});
