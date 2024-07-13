const MODULE_NAME = 'ckl-auto-heal-targets';
const key = 'chat-healed';

const isFirstGM = () => !!game.users.activeGM?.isSelf;

const self = (me) => typeof me === 'function' ? me() : me;

const ifDebug = (func) => {
    if (Settings.debug) {
        return self(func);
    }
};

class ChatData {
    constructor(doc) {
        this.item = doc.itemSource;
        this.action = this.item?.actions.get(doc.flags?.pf1?.metadata?.action);
        this.attacks = doc.flags?.pf1?.metadata?.rolls?.attacks;
        this.isHealing = this.action?.isHealing;
        this.actor = fromUuidSync(doc.flags?.pf1?.metadata?.actor);

        this.targetIds = doc.flags?.pf1?.metadata?.targets ?? [];
        this.targets = this.targetIds
            .map((uuid) => fromUuidSync(uuid))
            .filter(x => !!x)
            .filter(x => this.#canHealTarget(this.actor, x));
        this.targetTokens = this.targets.map(x => x.object);

        ifDebug(() => {
            console.log('Checking chat card for Heal Friendly Targets');
            console.log(' - targets:', this.targets.map(x => x.id));
            console.log(' - item:', this.item);
            console.log(' - actor:', this.actor);
            console.log(' - action:', this.action);
            console.log(' - isHealing:', this.isHealing);
        });

        this.isValid = this.actor && this.targets?.length && this.action && this.attacks?.length && this.isHealing;
    }

    get amountHealed() {
        const total = this.attacks
            .flatMap((attack) => attack.damage)
            .map((damage) => damage.total)
            .reduce((acc, curr) => acc + curr, 0);
        return total;
    }

    #canHealTarget(actor, tokenDoc) {
        return Settings.healAll || this.#isSameDisposition(actor, tokenDoc);
    }

    #isSameDisposition(actor, tokenDoc) {
        const actorTokenDoc = actor?.getActiveTokens()[0]?.document || actor?.prototypeToken;
        return !actorTokenDoc || actorTokenDoc.disposition === tokenDoc.disposition
    };
}

Hooks.on('createChatMessage', async (doc, _options, userId) => {
    if (!game.users.activeGM) {
        ui.notifications.warn(game.i18n.localize(`${MODULE_NAME}.no-gm-warning`));
        return;
    }

    if (!isFirstGM()) {
        return;
    }

    const data = new ChatData(doc);

    if (!data.isValid) {
        ifDebug(() => console.log(' - failed check, this is not healing, there was nothing rolled, there were no targets, or there was no source actor'));
        return;
    }

    ifDebug(() => console.log(` - healing targets for [[${data.amountHealed}]]`));
    await pf1.documents.actor.ActorPF.applyDamage(-data.amountHealed, { targets: data.targetTokens });
    await doc.setFlag(MODULE_NAME, key, data.amountHealed);
});

// append info about which targets were healed. Only show the visible ones instead of all targets.
Hooks.on(
    "renderChatMessage",
    /**
     * @param {ChatMessage} cm - Chat message instance
     * @param {JQuery<HTMLElement>} jq - JQuery instance
     * @param {object} options - Render options
     */
    (cm, jq, options) => {
        if (!Settings.showHealingHint) return;

        const amountHealed = cm.getFlag(MODULE_NAME, key);
        if (!amountHealed) return;

        const element = jq[0];
        const uuids = [...element.querySelectorAll('.target:not([display=none])')].map(x => x.dataset.uuid);

        const data = new ChatData(cm);
        const targets = data.targets.filter(x => uuids.includes(x.uuid));

        const footer = element.querySelector('footer');

        const formatter = new Intl.ListFormat(game.i18n.lang);
        const targetLinks = targets
            .map(x => `<a class="target" data-uuid="${x.uuid}"><span class="target-image">${x.name}</span></a>`) // TODO make sure I'm using the proper name if the observer doesn't know it
        const message = game.i18n.format(
            `${MODULE_NAME}.heal-description`,
            { amountHealed, targets: formatter.format(targetLinks) },
        );

        const div = `
            <div class="property-group flexcol">
                <label>${game.i18n.localize(MODULE_NAME + '.healing-label')}</label>
                <div class="attack-targets" style="white-space:pre;place-content:start;">${message}</div>
            </div>
        `;
        const enriched = TextEditor.enrichHTML(div, { async: false });
        // footer.insertAdjacentHTML('afterend', enriched);

        const createdElement = document.createElement('div');
        createdElement.innerHTML = enriched;

        const _jq = $(createdElement);
        pf1.utils.chat.addTargetCallbacks(null, _jq);
        footer.after(_jq[0]);
    }
);

class Settings {
    static {
        Hooks.on('init', () => {
            this.#register(this.#debug, { defaultValue: false });
            this.#register(this.#healAll, { defaultValue: true });
            this.#register(this.#showHealingHint, { defaultValue: true, scope: 'client' });
        });
    }

    static #register = (key, {
        config = true,
        defaultValue = null,
        scope = 'world',
        settingType = Boolean,
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

    static #showHealingHint = 'show-healing-hint';
    static get showHealingHint() {
        return !!game.settings.get(MODULE_NAME, this.#showHealingHint);
    }
}
