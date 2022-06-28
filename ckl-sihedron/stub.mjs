// Hooks.once('init', () => console.log('¡¡¡ STUB MODULE !!!', game.i18n.localize('STUB.Message')));

import { createHealCard } from './chat-card-maker.mjs';

const MODULE_NAME = 'ckl-sihedron';

let socket;
Hooks.once('socketlib.ready', () => {
    socket = socketlib.registerModule(MODULE_NAME);
    socket.register('takeSihedron', takeSihedron);

    window.Sihedron = { useSihedron };
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

const capitalizeFirstLetter = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const getOwningUser = (doc) => {
    if (!doc) return false;

    const playerOwners = Object.entries(doc.data.permission)
        .filter(([id, level]) => (!game.users.get(id)?.isGM && game.users.get(id)?.active) && level === 3)
        .map(([id]) => id);

    if (playerOwners.length > 0) {
        return game.users.get(playerOwners[0]);
    }

    /* if no online player owns this actor, fall back to first GM */
    return game.users.find(u => u.isGM && u.active);
}

function takeSihedron(toActorId, fromActorId, itemId) {
    const fromActor = game.actors.get(fromActorId);
    const item = fromActor.getEmbeddedDocument('Item', itemId);
    const itemData = item.toObject();

    const target = game.actors.get(toActorId);
    await target.createEmbeddedDocuments('Item', [itemData]);

    // todo move "heal token" to here instead of in "on equip" and remove "shouldHeal" flag
}

function useSihedron(equipped, actor, token, item) {
    let justReceived = false;

    const executeApplyBuff = (command) => {
        window.macroChain = [command + ' '];
        game.macros.getName('applyBuff')?.execute({ actor, token });
        // todo chat card
    }

    const turnOffAllBuffs = () => allVirtues.forEach((virtue) => {
        executeApplyBuff(`Remove ${buffs[virtue].name}`);
    });

    const healToken = async () => {
        if (typeof token === 'undefined' || !token) {
            return;
        }

        const originalControlled = canvas.tokens.controlled;

        token.control();
        const roll = RollPF.safeRoll('2d8 + 10');
        await game.pf1.documents.ActorPF.applyDamage(-roll.total);
        createHealCard(item, actor, token, roll);

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

        await item.unsetFlag(MODULE_NAME, 'virtue');
        await healToken();
        await item.setFlag(MODULE_NAME, 'healOnEquip', true);
        executeApplyBuff('Apply Sihedron!');

        // execute on player owner's client
        const target = game.actors.get(targetData.id);
        try {
            const targetUserId = getOwningUser(target)?.id;
            await socket.executeAsUser('takeSihedron', targetUserId, target.id, actor.id, item.id);
        }
        // if fails (e.g. user isn't logged in), then execute on GM client
        catch {
            await socket.executeAsGM('takeSihedron', target.id, actor.id, item.id);
        }

        await item.delete();
    }
}
