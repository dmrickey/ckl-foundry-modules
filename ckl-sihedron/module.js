// Hooks.once('init', () => console.log('¡¡¡ STUB MODULE !!!', game.i18n.localize('STUB.Message')));

import { createHealCard } from './chat-card-maker.js';

const MODULE_NAME = 'ckl-sihedron';

let socket;
Hooks.once("socketlib.ready", () => {
    socket = socketlib.registerModule(MODULE_NAME);
    socket.register('takeSihedron', takeSihedron);

    window.Sihedron = { setSihedronEquip, useSihedron };
});

// This requires `Warpgate`
//   - for showing the button menu
//   - for adding SLAs from the different Sihedron buffs
// This requires `socketlib` - for making sure the equip happens on the expected client so the menu shows up as expected
// This requires that Noon's `applyBuff` macro be in your world - I highly suggest changing the default notification level to 1 or even 0.
// This requires that you have configured Buffs in your world for this macro to swap between
//   - import the buffs into your world from the included compendium
//   - OR add the compendium to your `applyBuff` macro configuration
//   - OR create your own - (see `buffs` variable below for expected names) - plus a buff for +2 bonus to saves called `Sihedron!`

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

// todo create pack and get id
const sihedronItemPackId = '';
const getItem = async (name) => {
    const pack = game.packs.get(sihedronItemPackId);
    const itemId = pack.index.getName(name)._id;
    return await pack.getDocument(itemId);
};

const executeApplyBuff = (actor, command) => {
    window.macroChain = [command];
    game.macros.getName('applyBuff')?.execute();
    // todo chat card
}

const turnOffAllBuffs = (actor) => allVirtues.forEach((virtue) => {
    executeApplyBuff(actor, `Remove ${buffs[virtue].name} from ${actor.name}`);
});

const applyBuff = (actor, buffName) => executeApplyBuff(actor, buffName);

const capitalizeFirstLetter = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const getOwningUserId = (doc) => {
    if (!doc) {
        return undefined;
    }

    const playerOwnerId = Object.entries(doc.data.permission)
        .find(([id, level]) => !game.users.get(id)?.isGM && game.users.get(id)?.active && level === 3)
        ?.[0];

    // if no active players own this actor, fall back to first GM
    return playerOwnerId || game.users.find(u => u.isGM && u.active)?.id;
}

const healActor = async (actor, item) => {
    if (typeof actor === 'undefined' || !actor) {
        return;
    }

    const toHeal = RollPF.safeRoll('2d8 + 10');
    console.log(`healed '${toHeal.total}' to '${actor.name}'`);
    await actor.applyDamage(-toHeal.total);
    // todo get token
    // const token = [...canvas.scene.tokens].find((x) => x.actor.id === actor.id)?.object;
    // createHealCard(item, actor, token, toHeal);

    // todo - does this work?
    // let chatOptions = {
    //     user: game.user._id,
    //     speaker: ChatMessage.getSpeaker(),
    //     content: `${`actor`.name} automatically healed for [[${amount}[positive]]].`
    // };
    // ChatMessage.create(chatOptions);
}

const takeItem = async (targetActorId, fromActorId, itemId) => {
    const fromActor = game.actors.get(fromActorId);
    const item = fromActor.getEmbeddedDocument('Item', itemId);
    const itemData = item.toObject();

    const targetActor = game.actors.get(targetActorId);
    await targetActor.createEmbeddedDocuments('Item', [itemData]);
    return itemData;
};

async function takeSihedron(targetActorId, fromActorId, itemId) {
    const item = await takeItem(targetActorId, fromActorId, itemId);

    const targetActor = game.actors.get(targetActorId);
    await healActor(targetActor, item);
    applyBuff(targetActor, `Apply Sihedron! to ${targetActor.name}`);
}

const makeMenuChoice = async (actor, sihedronItem, showGive = true) => {
    const currentVirtue = sihedronItem.getFlag(MODULE_NAME, 'virtue');
    const buttons = allVirtues
        .filter((virtue) => !buffs[currentVirtue]?.opposed.has(virtue))
        .filter((virtue) => !currentVirtue || virtue !== currentVirtue)
        .map((virtue) => ({ label: capitalizeFirstLetter(virtue), value: virtue }));
    if (showGive) {
        buttons.push({ label: 'Give', value: give });
    }
    buttons.push({ label: 'Cancel' });

    let virtueHints = '<div style="display: grid; grid-template-columns: auto 1fr; grid-column-gap: 1rem; grid-row-gap: .5rem">';
    allVirtues.forEach(virtue => {
        virtueHints += `<div>${capitalizeFirstLetter(virtue)}</div><div>${buffs[virtue].value}</div>`
    });
    virtueHints += '</div>';
    const inputs = [{ type: 'info', label: virtueHints }];

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

    turnOffAllBuffs(actor);

    if (allVirtues.includes(chosenVirtue)) {
        await sihedronItem.setFlag(MODULE_NAME, 'virtue', chosenVirtue);

        applyBuff(actor, `Apply ${buffs[chosenVirtue].name} to ${actor.name}`);
        return;
    }

    if (chosenVirtue === give) {
        const playerActorsInScene = canvas.tokens.placeables
            .filter(t => t.actor.hasPlayerOwner)
            .map(t => t.actor);
        const playerActors = game.users
            .map(x => x.character)
            .filter(x => !!x);
        const actors = [...playerActorsInScene, ...playerActors]
            .filter((x, i, arr) => arr.findIndex((y) => y.id === x.id) === i)
            .filter(x => x.id !== actor.id);

        const targetData = await game.pf1.utils.dialogGetActor('Give Sihedron to', actors);
        if (!targetData) {
            return false;
        }

        await healActor(actor, sihedronItem);
        applyBuff(actor, `Apply Sihedron! to ${actor.name}`);

        // execute on player owner's client
        const target = game.actors.get(targetData.id);
        try {
            const targetUserId = getOwningUserId(target);
            await socket.executeAsUser('takeSihedron', targetUserId, target.id, actor.id, sihedronItem.id);
        }
        catch {
            // if fails (e.g. user isn't logged in), then execute on GM client -- should never happen though
            await socket.executeAsGM('takeSihedron', target.id, actor.id, sihedronItem.id);
        }

        await sihedronItem.delete();
    }

    return true;
}

async function setSihedronEquip(actor, sihedronItem, shared, equipped) {
    try {
        await sihedronItem.unsetFlag(MODULE_NAME, 'virtue');
    }
    catch {
        // do nothing, the item has been deleted
    }

    if (!equipped) {
        turnOffAllBuffs(actor);
        return;
    }

    await useSihedron(actor, sihedronItem, shared);
}

async function useSihedron(actor, sihedronItem, shared) {
    var madeChoice = await makeMenuChoice(actor, sihedronItem, true);
    if (!madeChoice) {
        shared.reject = true;
    }
}
