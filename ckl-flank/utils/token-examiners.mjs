import { isAdjacent, isWithinRange } from "./positional-helpers.mjs";

const canBeFlanked = (token) => {
    // return token.actor.items.some((item) => item.system.bFlags.some((flag) => flag === 'noflank'));
    // todo - create a flag that can go in a feature/buff that I can add to creatures that can't be flanked.

    return true;
}

const isMouser = (token) => token.actor.items.some(x => x.name.toLowerCase().includes('underfoot assault'));

const hasSoloTactics = (token) => token.actor.items.some(x => {
    const name = x.name.toLowerCase();
    return (name.includes('fighter') || name.includes('solo')) && name.includes('tactics');
});

const hasOutflank = (token) => token.actor.items.some(x => x.name.toLowerCase().includes('outflank'));

const hasGangUp = (token) => token.actor.items.map(x => x.name.toLowerCase()).some(name => name.includes('gang up') || name.includes('gangup'));

const hasMenacing = (token) => token.actor.items.some(x => x.type === 'weapon' && x.system.equipped && x.name.toLowerCase().includes('menacing'));

const isRatfolk = (token) => token.actor.items.some(x => x.type === 'race' && x.name === 'Ratfolk');

const isThreatening = (token1, token2) => {
    const getMax = (action, reach = false) => {
        const max = action.getRange({ type: 'max' });
        if (isNaN(max)) {
            const sizeScale = token1.actor.system.traits.size;
            const size = pf1.config.sizeMods[sizeScale] >= 2
                ? 0
                : pf1.config.tokenSizes[sizeScale].w;
            const stature = token1.actor.system.traits.stature;
            // todo swap out 5s for metric agnostic version
            return size * 5 * (reach ? 2 : 1) * (stature === 'long' ? 2 : 1) + (size === 0 && reach ? 5 : 0);
        }
        return max;
    }

    const attacks = token1.actor?.items?.filter(x => x.type === 'attack') ?? [];
    if (!attacks.length) {
        return false;
    }

    const naturalAttacks = attacks.filter(x => x.system.attackType === 'natural')
        .flatMap(x => [...x.actions])
        .filter((action) => action.data.actionType === 'mwak' || ['melee', 'reach', 'touch'].includes(action.data.range.units));
    if (naturalAttacks.some(na => isWithinRange(token1, token2, 0, getMax(na)))) {
        return true;
    }

    const whipAttacks = attacks.filter(x => x.name.toLowerCase().includes('whip'))
        .flatMap(x => [...x.actions])
        .filter((action) => action.data.actionType === 'mwak' || ['melee', 'reach', 'touch'].includes(action.data.range.units));
    if (whipAttacks.some(whip => isWithinRange(token1, token2, 0, getMax(whip) * 3))) {
        return true;
    }

    const otherAttacks = attacks.filter(x => x.system.attackType !== 'natural')
        .flatMap(x => [...x.actions])
        .filter((action) => action.data.actionType === 'mwak' || ['melee', 'reach', 'touch'].includes(action.data.range.units));

    const weapons = otherAttacks.filter(x => x.data.range.units !== 'reach');
    for (let i = 0; i < weapons.length; i++) {
        const weapon = weapons[i];
        if (isWithinRange(token1, token2, 0, getMax(weapon))) {
            return true;
        }
    }

    const reachAttacks = otherAttacks.filter(x => x.data.range.units === 'reach');
    for (let i = 0; i < reachAttacks.length; i++) {
        const reach = reachAttacks[i];
        if (!isAdjacent(token1, token2) && isWithinRange(token1, token2, getMax(reach, true) / 2, getMax(reach, true))) {
            return true;
        }
    }

    return false;
};

const hasImprovedOutflank = (token) => token.actor.items.some(x => x.name.toLowerCase().includes('improved outflank'));

export {
    canBeFlanked,
    hasGangUp,
    hasImprovedOutflank,
    hasMenacing,
    hasOutflank,
    hasSoloTactics,
    isMouser,
    isRatfolk,
    isThreatening,
};
