import { flankId, flankMenacingAndOutflankId, menacingId, outflankId, turnOffFlankAsync, turnOnBuffAsync } from "./utils/buff-handlers.mjs";
import { getEmptyAdjacentMeSquares, isAdjacent, isFlanking, isSharingSquare } from "./utils/positional-helpers.mjs";
import { canBeFlanked, hasGangUp, hasImprovedOutflank, hasMenacing, hasOutflank, hasSoloTactics, isMouser, isRatfolk, isThreatening } from "./utils/token-examiners.mjs";
import { amILowestOwner } from "./utils/utils.mjs";

const rankedBuffs = {
    [flankId]: 1,
    [outflankId]: 2,
    [menacingId]: 2,
    [flankMenacingAndOutflankId]: 3,
};

/**
 * Assumes a single target because this is intended for melee attacks which are almost always a single target.
 * @param {TokenPF} meToken - my token
 * @param {TokenPF} targetToken - token I'm targeting
 * @param {*} friends - all allies (tokens with my same disposition)
 */
const handleFlanking = async (meToken, targetToken, friends = null) => {
    if (!meToken) {
        return;
    }

    await turnOffFlankAsync(meToken);

    if (!targetToken
        || !canBeFlanked(targetToken)
        || !isThreatening(meToken, targetToken)
        || meToken === targetToken
        || meToken.document.disposition === targetToken.document.disposition
    ) {
        return;
    }

    let bestFlankId = null;
    const setBestFlank = (flankFriend) => {
        const outflank = hasOutflank(meToken) && (hasSoloTactics(meToken) || hasOutflank(flankFriend));
        const menacing = hasMenacing(meToken) || hasMenacing(flankFriend);

        const scopedBestFlankId = outflank && menacing
            ? flankMenacingAndOutflankId
            : outflank ? outflankId
                : menacing ? menacingId
                    : flankId;

        if (bestFlankId) {
            bestFlankId = rankedBuffs[bestFlankId] < rankedBuffs[scopedBestFlankId]
                ? scopedBestFlankId
                : bestFlankId;
        }
        else {
            bestFlankId = scopedBestFlankId;
        }
    }

    const gangUpFriends = [];

    friends ||= canvas.tokens.placeables.filter(t => t.disposition === meToken.disposition && t.id !== meToken.id);
    for (const friend of friends) {

        if (targetToken === friend || !isThreatening(friend, targetToken)) {
            continue;
        }

        // todo
        // if (hasPackFlanking(meToken)
        //     && isMyCompanion(friend)
        //     && isAdjacent(meToken, friend)
        // ) {
        //     setBestFlank(friend);
        // }
        if (isFlanking(meToken, friend, targetToken)
        ) {
            setBestFlank(friend);
        }
        else if (isMouser(friend)
            && isAdjacent(meToken, friend)
            && isSharingSquare(friend, targetToken)
        ) {
            setBestFlank(friend);
        }
        else if (isMouser(meToken)
            && isAdjacent(meToken, friend)
            && isSharingSquare(meToken, targetToken)
        ) {
            setBestFlank(friend);
        }
        else if (isRatfolk(meToken)
            && isRatfolk(friend)
            && isSharingSquare(meToken, friend)
        ) {
            setBestFlank(friend);
        }
        else if (hasImprovedOutflank(meToken)
            && (hasSoloTactics(meToken) || hasImprovedOutflank(friend))
            && getEmptyAdjacentMeSquares(meToken).some((me) => isThreatening(me, target) && isFlanking(me, friend, targetToken))
        ) {
            setBestFlank(friend);
        }

        if (hasGangUp(meToken)) {
            gangUpFriends.push(friend);
        }
    }

    if (gangUpFriends.length >= 2) {
        gangUpFriends.forEach(f => setBestFlank(f));
    }

    if (bestFlankId) {
        await turnOnBuffAsync(meToken, bestFlankId);
    }
};

Hooks.on('updateToken', async (token, update, _options, _userId) => {
    if (!game.combat
        && !update?.hasOwnProperty('x')
        && !update?.hasOwnProperty('y')
    ) {
        return;
    }

    const myTokens = canvas.tokens.placeables.filter(x => amILowestOwner(x));
    if (!myTokens.length) {
        return;
    }

    const myTargets = game.user.targets;
    if (!myTargets.length) {
        await Promise.all(myTokens.map(async (myToken) => await turnOffFlankAsync(myToken)));
        return;
    }

    // if I move
    if (myTokens.some(x => x.id === token.id)) {
        const fullToken = canvas.tokens.get(token.id).clone();
        await Promise.all(myTargets.map(async (targetToken) => await handleFlanking(fullToken, targetToken)));
    }
    // else if my target moves
    else if (myTargets.some(x => x.id === token.id)) {
        const myMovingTargetedToken = myTargets.find(x => x.id === token.id).clone();
        await Promise.all(myTokens.map(async (myToken) => await handleFlanking(myToken, myMovingTargetedToken)));
    }
    // else if a friendly player that I could be flanking with moves
    else {
        const movingToken = canvas.tokens.get(token.id).clone();
        myTokens = canvas.tokens.placeables.filter(x => x.disposition === movingToken.disposition && amILowestOwner(x))
        for (const myToken of myTokens) {
            for (const targeted of myTargets) {
                const otherFriends = canvas.tokens.placeables.filter(t =>
                    t.disposition === myToken.disposition
                    && t.id !== myToken.id
                    && t.id !== token.id);
                await handleFlanking(myToken, targeted, [...otherFriends, movingToken]);
            }
        }
    }
});

Hooks.on("targetToken", async (user, targetToken, targetted) => {
    if (!game.combat || user !== game.user) {
        return;
    }

    let myTokens;
    if (user.isGM) {
        myTokens = canvas.tokens.controlled;
    } else {
        myTokens = canvas.tokens.placeables.filter(x => x.isOwner);
    }

    if (!myTokens.length) {
        return;
    }

    await Promise.all(myTokens.map(async (myToken) => await targetted ? handleFlanking(myToken, targetToken) : turnOffFlankAsync(myToken)));
});
