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
    const targetIds = doc.flags?.pf1?.metadata?.targets ?? [];
    const targets = targetIds.map((uuid) => fromUuidSync(uuid)?.object).filter(x => !!x);
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
