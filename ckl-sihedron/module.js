// This requires `Warpgate`
//   - for showing the button menu
// This requires `socketlib` - for making sure the equip happens on the expected client so the menu shows up as expected
// this supports Koboldworks - Regeneration for the Temperence buff which grants Fast Healing

const MODULE_ID = 'ckl-sihedron';
const COMPENDIUM_ID = 'ckl-sihedron';

Hooks.once('pf1PostReady', () => {
    const wrapped = pf1.applications.actor.ActorSheetPF.prototype._onItemGive;
    pf1.applications.actor.ActorSheetPF.prototype._onItemGive = function (event) {
        _onItemGive(this, event, () => wrapped.apply(this, arguments));
    };
});

let socket;
Hooks.once("socketlib.ready", () => {
    socket = socketlib.registerModule(MODULE_ID);
    socket.register('takeSihedron', takeSihedron);

    // goes in `On Use` and `On Equip` advanced script calls
    window.Sihedron = { setSihedronEquip, useSihedron };
});

// I couldn't find a clean way to delete the item in _all_ ways it could be deactivated -- this fails when it is deactivated from time passing
// Hooks.on("updateItem", (item, change) => {
//     if (item.flags?.core?.sourceId === coreId(sihedronBuffId)
//         && change.system?.hasOwnProperty('active')
//         && !change.system.active
//         && shouldHandleDoc(item)
//     ) {
//         setTimeout(async () => await item.delete());
//     }
// });

const charity = 'charity';
const generosity = 'generosity';
const humility = 'humility';
const kindness = 'kindness';
const love = 'love';
const temperance = 'temperance';
const zeal = 'zeal';

const sihedronId = 'OHK1X2ARPQ9ABa87';
const sihedronBuffId = 'oH1JmY5FV5wpghop';

const buffs = {
    [charity]: { id: 'OAmMMUJVd6yrLmk4', name: 'Sihedron - Charity', value: '+4AC, Dimensional Anchor', opposed: new Set([kindness, temperance]) },
    [generosity]: { id: '6ikCkdJTRdTHfScE', name: 'Sihedron - Generosity', value: '+4 Attack Rolls, Beast Shape', opposed: new Set([humility, love]) },
    [humility]: { id: '6DvE3p04LPHjyjFC', name: 'Sihedron - Humility', value: '+8 Skill Checks, Greater Invisibility', opposed: new Set([generosity, zeal]) },
    [kindness]: { id: 'NHgaOdTqUSoaXrKk', name: 'Sihedron - Kindness', value: '+4 Weapon Damage, Ice Storm', opposed: new Set([charity, zeal]) },
    [love]: { id: 'o8SBJYa8XbzLQRPk', name: 'Sihedron - Love', value: '+8 Initiative, Charm Monster', opposed: new Set([generosity, temperance]) },
    [temperance]: { id: 'yqNgMklrjyNQlRzi', name: 'Sihedron - Temperance', value: 'Fast Healing 10, Fear', opposed: new Set([charity, love]) },
    [zeal]: { id: 'le90gLs6bWbDJw9P', name: 'Sihedron - Zeal', value: '+8 Concentration/Caster Level Checks, Dimension Door', opposed: new Set([humility, kindness]) },
}
const allVirtues = Object.keys(buffs);

const coreId = (id) => `Compendium.${MODULE_ID}.${COMPENDIUM_ID}.${id}`;

const give = 'give';

const addCompendiumBuffToActor = async (actor, buffId) => {
    const pack = game.packs.get(`${MODULE_ID}.${COMPENDIUM_ID}`);
    const item = await pack.getDocument(buffId);
    const buff = item.toObject();
    buff.system.active = true;
    buff.flags ||= {};
    buff.flags.core ||= {};
    buff.flags.core.sourceId = coreId(item._id);

    const created = (await actor.createEmbeddedDocuments("Item", [buff]))[0];
    return created;
};
const addSihedronBuff = async (actor) => {
    const hasBuff = actor?.items.some((item) => item?.flags?.core?.sourceId === coreId(sihedronBuffId));
    if (!hasBuff) {
        await addCompendiumBuffToActor(actor, sihedronBuffId);
    }
}

const turnOffAllBuffs = async (actor) => {
    const buffs = (actor?.items || []).filter((item) => item?.flags?.[MODULE_ID]?.tempBuff);
    if (buffs.length) {
        await actor.deleteEmbeddedDocuments("Item", buffs.map((buff) => buff.id));
    }
};

const capitalizeFirstLetter = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const shouldHandleDoc = (doc) => getOwningUserId(doc) === game.userId;
const getOwningUserId = (doc) => {
    if (!doc) {
        return undefined;
    }

    const playerOwnerId = Object.entries(doc.ownership)
        .find(([id, level]) => !game.users.get(id)?.isGM && game.users.get(id)?.active && level === 3)
        ?.[0];

    // if no active players own this actor, fall back to first GM
    return playerOwnerId || game.users.find(u => u.isGM && u.active)?.id;
}

const healActor = async (actor) => {
    if (typeof actor === 'undefined' || !actor) {
        return;
    }

    const healRoll = RollPF.safeRoll('2d8 + 10');
    console.log(`healed '${healRoll.total}' to '${actor.name}'`);
    await actor.applyDamage(-healRoll.total);

    const chatOptions = {
        user: game.user._id,
        speaker: ChatMessage.getSpeaker(),
        rolls: [healRoll],
        content: `The Sihedron heals ${actor.name} for ${healRoll.total}.`,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    };
    ChatMessage.create(chatOptions);
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
    await healActor(targetActor);
    await addSihedronBuff(targetActor);

    return true;
}

const makeMenuChoice = async (actor, sihedronItem, showGive = true) => {
    const currentVirtue = sihedronItem.getFlag(MODULE_ID, 'virtue');
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

    const { buttons: chosenVirtue } = await warpgate.menu({ buttons, inputs }, { title: `${actor.name}: Choose a point` });

    if (!chosenVirtue) {
        return false;
    }

    if (allVirtues.includes(chosenVirtue)) {
        await turnOffAllBuffs(actor);
        await sihedronItem.setFlag(MODULE_ID, 'virtue', chosenVirtue);
        const buff = await addCompendiumBuffToActor(actor, buffs[chosenVirtue].id);
        buff.use();
        return false;
    }
    else if (chosenVirtue === give) {
        await handleItemGive(actor, sihedronItem);
    }

    return true;
}

async function setSihedronEquip(actor, sihedronItem, shared, equipped) {
    try {
        await sihedronItem.unsetFlag(MODULE_ID, 'virtue');
    }
    catch {
        // do nothing, the item has been deleted
    }

    if (!equipped) {
        await turnOffAllBuffs(actor);
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

async function _onItemGive(actorSheet, event, originalFunc) {
    event.preventDefault();

    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = actorSheet.document.items.get(itemId);
    const { actor } = actorSheet;
    const isSihedron = item?.flags?.core?.sourceId === coreId(sihedronId);

    return isSihedron
        ? handleItemGive(actor, item)
        : originalFunc();
}

async function handleItemGive(actor, item) {
    const targets = [
        ...game.actors.contents.filter((o) => o.testUserPermission(game.user, "OWNER") && o.id !== actor.id && o.type !== 'basic'),
        ...game.actors.contents.filter(
            (o) => o.hasPlayerOwner && o.id !== actor.id && !o.testUserPermission(game.user, "OWNER") && o.type !== 'basic'),
    ];
    const targetData = await pf1.utils.dialog.dialogGetActor(`Give item to actor`, targets);

    if (!targetData) return;
    let target;
    if (targetData.type === "actor") {
        target = game.actors.get(targetData.id);
    }

    if (target) {
        // execute on player owner's client
        let handled = false;
        try {
            const targetUserId = getOwningUserId(target);
            handled = await socket.executeAsUser('takeSihedron', targetUserId, target.id, actor.id, item.id);
        }
        catch {
            // if fails (e.g. user isn't logged in), then execute on GM client
            handled = await socket.executeAsGM('takeSihedron', target.id, actor.id, item.id);
        }

        if (!handled) {
            ui.notifications.error(`${target.name} was unable to accept the Sihedron.`);
            return;
        }

        const chatOptions = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            content: `${actor.name} sends the Sihedron to ${target.name}!`
        };
        ChatMessage.create(chatOptions);

        await addSihedronBuff(actor);
        await healActor(actor);
        await item.delete();
    }
}
