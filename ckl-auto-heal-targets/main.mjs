const MODULE_NAME = 'ckl-auto-heal-targets';

const isFirstGM = () => !!game.users.activeGM?.isSelf;

const self = (me) => typeof me === 'function' ? me() : me;

const ifDebug = (func) => {
    if (Settings.debug) {
        return self(func);
    }
};

const isSameDisposition = (actor, tokenPF) => {
    const actorTokenDoc = actor?.getActiveTokens()[0]?.document || actor?.prototypeToken;
    return !actorTokenDoc || actorTokenDoc.disposition === tokenPF.document.disposition
};
const canHealTarget = (actor, tokenPF) => {
    return Settings.healAll || isSameDisposition(actor, tokenPF);
}

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

    const targetIds = doc.flags?.pf1?.metadata?.targets ?? [];
    const targets = targetIds
        .map((uuid) => fromUuidSync(uuid)?.object)
        .filter(x => !!x)
        .filter(x => canHealTarget(actor, x));

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

    const user = game.users.get(userId);
    const visibility = { seen: [], unseen: [] };
    targets.forEach((token) => {
        const isVisible = token?.isVisible ?? false;
        const isObserver = token.actor?.testUserPermission(user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER) ?? false;
        if (isVisible || isObserver) {
            visibility.seen.push(token);
        }
        else {
            visibility.unseen.push(token);
        }
    });

    const { seen, unseen } = visibility;
    // TODO instead of creating messages, modify the document contents. Also add "gm-sensitive" class to unseen
    if (seen.length) {
        const content = game.i18n.format(
            `${MODULE_NAME}.heal-description`,
            { amountHealed: total, targets: seen.map(x => x.name).join(', ') },
        );
        const chatOptions = {
            user: userId,
            speaker: doc.speaker,
            content,
        };
        ChatMessage.create(chatOptions);
    }

    if (unseen.length) {
        const content = game.i18n.format(
            `${MODULE_NAME}.hidden-heal-description`,
            { amountHealed: total, targets: unseen.map(x => x.name).join(', ') },
        );
        const chatOptions = {
            user: userId,
            speaker: doc.speaker,
            content,
        };
        ChatMessage.create(chatOptions, { rollMode: CONST.DICE_ROLL_MODES.PRIVATE });
    }
});

class Settings {
    static {
        Hooks.on('ready', () => {
            this.#register(this.#debug, { defaultValue: false, settingType: Boolean });
            this.#register(this.#healAll, { defaultValue: true, settingType: Boolean, scope: 'client' });
        });
    }

    static #register = (key, {
        config = true,
        defaultValue = null,
        scope = 'world',
        settingType = String,
    }) =>
        game.settings.register(MODULE_NAME, key, {
            name: `${MODULE_NAME}.settings.${key}.name`,
            hint: `${MODULE_NAME}.settings.${key}.hint`,
            default: defaultValue,
            scope,
            requiresReload: false,
            config,
            type: settingType
        });

    static #debug = 'debug';
    static get debug() {
        return !!game.settings.get(MODULE_NAME, this.#debug);
    }

    static #healAll = 'heal-all';
    static get healAll() {
        return !!game.settings.get(MODULE_NAME, this.#healAll);
    }
}
