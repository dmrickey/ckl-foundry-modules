const MODULE_NAME = 'ckl-heal-friendly-targets';

const isFirstGM = () => !!game.users.activeGM?.isSelf;

const self = (me) => typeof me === 'function' ? me() : me;

const ifDebug = (func) => {
    // todo read game setting
    if (false) {
        return self(func);
    }
};

Hooks.on('createChatMessage', async (doc, _options, userId) => {
    if (!isFirstGM()) {
        return;
    }

    // const targets = doc.targets; // bugged in pf1 9.4 and still bugged in 10.4
    const item = doc.itemSource;
    const action = item?.actions.get(doc.flags?.pf1?.metadata?.action);
    const attacks = doc.flags?.pf1?.metadata?.rolls?.attacks;
    const isHealing = action?.isHealing;
    const actor = fromUuidSync(doc.flags?.pf1?.metadata?.actor);
    const actorTokenDoc = actor?.getActiveTokens()[0]?.document || actor.prototypeToken;

    const targetIds = doc.flags?.pf1?.metadata?.targets ?? [];
    const targets = targetIds
        .map((uuid) => fromUuidSync(uuid)?.object)
        .filter(x => !!x)
        .filter(x => !actorTokenDoc || actorTokenDoc.disposition === x.document.disposition);

    ifDebug(() => {
        console.log('Checking chat card for Heal Friendly Targets');
        console.log(' - targets:', targets.map(x => x.id));
        console.log(' - item:', item);
        console.log(' - actor:', actor);
        console.log(' - action:', action);
        console.log(' - isHealing:', isHealing);
    })

    if (!actor || !targets?.length || !action || !attacks?.length || !isHealing) {
        ifDebug(() => console.log(' - failed check, this is not healing, there was nothing rolled, there were no targets, or there was no source actor'));
        return;
    }

    const mod = isHealing ? -1 : 1;

    const total = attacks
        .flatMap((attack) => attack.damage)
        .map((damage) => damage.total)
        .reduce((acc, curr) => acc + curr, 0);

    ifDebug(() => console.log(` - healing targets for [[${total}]]`));
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
