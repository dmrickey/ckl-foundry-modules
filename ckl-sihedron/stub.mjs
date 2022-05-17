// Hooks.once('init', () => console.log('¡¡¡ STUB MODULE !!!', game.i18n.localize('STUB.Message')));

const MODULE_NAME = 'ckl-sihedron';

let socket;
Hooks.once('socketlib.ready', () => {
    socket = socketlib.registerModule(MODULE_NAME);
    socket.register('takeSihedron', takeSihedron);
});

// This requires `Warpgate` - for showing the button menu
// This requires `Tagger` - for grabbing all the player tokens in the scene for valid choices to give the Sihedron to (and they all have to be tagged `player`)
// This requires that Noon's `applyBuff` macro be in your world (I've also modified it to prevent spam when turning off buffs. you'll have to remove the "skipMessage" part from where buffs are being turned off).
// This requires that you have configured Buffs in your world for this macro to swap between (see `buffs` variable below for expected names) - plus a buff for +2 bonus to saves called `Sihedron!`

// goes in `On Use` and `On Equip` advanced script calls

const charity = 'charity';
const generosity = 'generosity';
const humility = 'humility';
const kindness = 'kindness';
const love = 'love';
const temperance = 'temperance';
const zeal = 'zeal';

const buffs = {
    [charity]: { name: 'Sihedron - Charity', value: '+4AC, Dimensional Anchor', opposed: new Set([kindness, temperance]) },
    [generosity]: { name: 'Sihedron - Generosity', value: '+4 Attack Rolls, Beast Shape', opposed: new Set([humility, love]) },
    [humility]: { name: 'Sihedron - Humility', value: '+8 Skill Checks, Greater Invisibility', opposed: new Set([generosity, zeal]) },
    [kindness]: { name: 'Sihedron - Kindness', value: '+4 Weapon Damage, Ice Storm', opposed: new Set([charity, zeal]) },
    [love]: { name: 'Sihedron - Love', value: '+8 Initiative, Charm Monster', opposed: new Set([generosity, temperance]) },
    [temperance]: { name: 'Sihedron - Temperance', value: 'Fast Healing 10, Fear', opposed: new Set([charity, love]) },
    [zeal]: { name: 'Sihedron - Zeal', value: '+8 Concentration/Caster Level Checks, Dimension Door', opposed: new Set([humility, kindness]) },
}
const allVirtues = Object.keys(buffs);

const give = 'give';

const capitalizeFirstLetter = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function takeSihedron(toActorId, fromActorId, itemId) {
    const fromActor = game.actors.get(fromActorId);
    const item = fromActor.getEmbeddedDocument('Item', itemId);
    const itemData = item.toObject();

    const target = game.actors.get(toActorId);
    await target.createEmbeddedDocuments('Item', [itemData]);
}

function handleSihedron(equipped, actor, token, item) {
    let justReceived = false;

    const executeApplyBuff = (command) => {
        window.macroChain = [command];
        game.macros.getName('applyBuff')?.execute({ actor, token });
        // todo chat card
    }

    const turnOffAllBuffs = () => allVirtues.forEach((virtue) => {
        executeApplyBuff(`Remove ${buffs[virtue].name} skipMessage`);
    });

    const healToken = async (token) => {
        if (typeof token === 'undefined' || !token) {
            return;
        }

        const originalControlled = canvas.tokens.controlled;

        token.control();
        const amount = RollPF.safeTotal('2d8 + 10');
        await game.pf1.documents.ActorPF.applyDamage(-amount);
        // todo chat card

        // todo use this example
        function postToChat(damage) {
            let finalDamage = Math.floor((damage - 5) / 2);
            let chatData = {
                user: game.user._id,
                speaker: {
                    alias: "Damage Taken"
                },
                content: `The damage taken is: <b>${finalDamage}<b>`,
            };
            ChatMessage.create(chatData, {});
        };

        canvas.tokens.releaseAll();
        originalControlled.forEach(t => t.control({ releaseOthers: false }));
    }

    if (typeof equipped !== 'undefined') {
        if (equipped) {
            const shouldHeal = item.getFlag(MODULE_NAME, 'healOnEquip');
            if (shouldHeal) {
                justReceived = true;
                await healToken(token);
                executeApplyBuff('Apply Sihedron!');
                await item.unsetFlag(MODULE_NAME, 'healOnEquip');
            }
        }
        // if unequipping
        else {
            turnOffAllBuffs();
            return;
        }
    }

    const currentVirtue = item.getFlag(MODULE_NAME, 'virtue');
    const buttons = allVirtues
        .filter((virtue) => !buffs[currentVirtue]?.opposed.has(virtue))
        .filter((virtue) => !currentVirtue || virtue !== currentVirtue)
        .map((virtue) => ({ label: capitalizeFirstLetter(virtue), value: virtue }));
    if (!justReceived) {
        buttons.push({ label: 'Give', value: give });
    }
    buttons.push({ label: 'Cancel' });

    let virtueHints = '<div style="display: grid; grid-template-columns: auto 1fr; grid-column-gap: 1rem; grid-row-gap: .5rem">';
    allVirtues.forEach(virtue => {
        virtueHints += `<div>${capitalizeFirstLetter(virtue)}</div><div>${buffs[virtue].value}</div>`
    });
    virtueHints += '</div>';
    inputs = [{ type: 'info', label: virtueHints }];

    if (currentVirtue) {
        inputs.push({ type: 'info', label: `Currently active: ${capitalizeFirstLetter(currentVirtue)}` });
    }

    if (buffs[currentVirtue]?.opposed) {
        const opp = [...buffs[currentVirtue].opposed];
        inputs.push({ type: 'info', label: `Currently opposed: ${opp[0]} and ${opp[1]}` });
    }

    const { buttons: chosenVirtue } = await warpgate.menu({ buttons, inputs }, { title: 'Choose a point' });

    if (!chosenVirtue) {
        return;
    }

    turnOffAllBuffs();

    if (allVirtues.includes(chosenVirtue)) {
        await item.setFlag(MODULE_NAME, 'virtue', chosenVirtue);

        executeApplyBuff(`Apply ${buffs[chosenVirtue].name}`);
        return;
    }

    if (chosenVirtue === give) {
        const playerActorsInScene = canvas.tokens.placeables
            .filter(t => t.actor.hasPlayerOwner)
            .map(t => t.actor);
        const playerActors = [...game.users].map(x => x.character);
        const actors = [...playerActorsInScene, ...playerActors]
            .filter((x, i, arr) => arr.findIndex((y) => y.id === x.id) === i)
            .filter(x => x.id !== actor.id);

        const targetData = await game.pf1.utils.dialogGetActor('Give Sihedron to', actors);
        if (!targetData) {
            shared.reject = true;
            return;
        }
        const target = game.actors.get(targetData.id);

        await item.unsetFlag(MODULE_NAME, 'virtue');
        await healToken();
        await item.setFlag(MODULE_NAME, 'healOnEquip', true);
        executeApplyBuff('Apply Sihedron!');

        // execute on player owner's client
        try {
            // todo targetUserId
            await socket.executeAsUser('takeSihedron', targetUserId, target.id, actor.id, item.id);
        }
        // if fails (e.g. user isn't logged in), then execute on GM client
        catch {
            await socket.executeAsGM('takeSihedron', target.id, actor.id, item.id);
        }

        await item.delete();
    }
}
