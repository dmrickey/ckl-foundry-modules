// top left of the map is (0,0)

const left = (token) => token.data.x;
const leftOf = (token, target) => right(token) <= left(target);

const right = (token) => token.data.x + token.w;
const rightOf = (token, target) => left(token) >= right(target);

const top = (token) => token.data.y;
const above = (token, target) => bottom(token) <= top(target);

const bottom = (token) => token.data.y + token.h;
const below = (token, target) => top(token) >= bottom(target);

const isSharingSquare = (token1, token2) =>
    left(token1) >= left(token2)
    && top(token1) >= top(token2)
    && right(token1) <= right(token2)
    && bottom(token1) <= bottom(token2);

const isAdjacent = (token1, token2) => {
    // is above or below target
    if ((left(token1) >= left(token2) && right(token1) <= right(token2))
        || right(token1) >= right(token2) && left(token1) <= left(token2)) {
        if (top(token1) == bottom(token2) || bottom(token1) == top(token2)) {
            return true;
        }
    }

    // is left or right of target
    if ((bottom(token1) >= bottom(token2) && top(token1) <= top(token2))
        || top(token1) >= top(token2) && bottom(token1) <= bottom(token2)) {
        if (left(token1) == right(token2) || right(token1) == left(token2)) {
            return true;
        }
    }

    // is diagonally adjacent to target
    if (left(token1) == right(token2) || right(token1) == left(token2)) {
        if (top(token1) == bottom(token2) || bottom(token1) == top(token2)) {
            return true;
        }
    }

    // if none of the above, return true if sharing the same square as adjacent is basically defined as "one square or closer"
    return isSharingSquare(token1, token2);
}

const isFlanking = (token1, token2, targetToken) => {
    // todo handle when token1/token2 are larger than one square
    // if diagonally opposite
    if ((leftOf(token1, targetToken) && rightOf(token2, targetToken) || rightOf(token1, targetToken) && leftOf(token2, targetToken))
        && ((above(token1, targetToken) && below(token2, targetToken)) || (below(token1, targetToken) && above(token2, targetToken)))
    ) {
        return true;
    }

    // if left/right opposite
    if ((leftOf(token1, targetToken) && rightOf(token2, targetToken) || rightOf(token1, targetToken) && leftOf(token2, targetToken))
        && !(above(token1, targetToken) || above(token2, targetToken) || below(token1, targetToken) || below(token2, targetToken))
    ) {
        return true;
    }

    // if top/bottom opposite
    if ((above(token1, targetToken) && below(token2, targetToken) || below(token1, targetToken) && above(token2, targetToken))
        && !(leftOf(token1, targetToken) || leftOf(token2, targetToken) || rightOf(token1, targetToken) || rightOf(token2, targetToken))
    ) {
        return true;
    }


    return false;
}

const flankId = "g3ijMEUDDC5aCBJx";
const outflankId = "O2kChp2l1YEb8poT";
const menacingId = "7XL5eaPni2gclCrY";
const flankMenacingAndOutflankId = "5ilpPsUueWFrpNZR";

const rankedBuffs = {
    [flankId]: 1,
    [outflankId]: 2,
    [menacingId]: 2,
    [flankMenacingAndOutflankId]: 3,
};

const allBuffIds = [flankId, outflankId, menacingId, flankMenacingAndOutflankId];

const getBuffPackAsync = async () => {
    const pack = game.packs.get("ckl-flank.ckl-flank");
    if (!pack.indexed) {
        await pack.getIndex();
    }
    return pack;
}

const getBuffDataAsync = async (id) => {
    const pack = await getBuffPackAsync();
    const buff = await pack.getDocument(id);
    return duplicate(buff.data);
}

const turnOnBuffAsync = async (token, buffId) => {
    const buff = await getBuffDataAsync(buffId);
    const item = token.actor.items.find(i => i.type === "buff" && i.name === buff.name);
    if (!item) {
        buff.data.active = true;
        await token.actor.createOwnedItem(buff);
    }
    else {
        await item.update({ "data.active": true });
    }
}

const turnOffFlankAsync = async (token) => {
    for (const id of allBuffIds) {
        const buff = await getBuffDataAsync(id);
        const item = token.actor.items.find(i => i.type === "buff" && i.name === buff.name);
        if (item) {
            await item.update({ "data.active": false });
        }
    }
}

const canBeFlanked = (token) => {
    // todo

    return true;
}

const isWithinRange = (token1, token2, minFeet, maxFeet) => {
    if (minFeet === 0 && isSharingSquare(token1, token2)) {
        return true;
    }

    const scene = game.scenes.active;
    const gridSize = scene.data.grid;

    if (maxFeet === 10) {
        const t1 = (x, y) => ({ data: { x, y }, h: token1.h, w: token1.w });
        // add "1 square (gridSize)" in all diagonals and see if adjacent
        if (isAdjacent(t1(left(token1) - gridSize, top(token1) - gridSize), token2)
            || isAdjacent(t1(left(token1) - gridSize, top(token1) + gridSize), token2)
            || isAdjacent(t1(left(token1) + gridSize, top(token1) - gridSize), token2)
            || isAdjacent(t1(left(token1) + gridSize, top(token1) + gridSize), token2)
        ) {
            return true;
        }
    }

    const isLeftOf = right(token1) <= left(token2);
    const isRightOf = left(token1) >= right(token2);
    const isAbove = bottom(token1) <= top(token2);
    const isBelow = top(token1) >= bottom(token2);

    // canvas.grid.grid.measureDistances([{ray: ray}], {gridSpaces: true})[0]

    let x1 = left(token1);
    let x2 = left(token2);
    let y1 = top(token1);
    let y2 = top(token2);

    if (isLeftOf) {
        x1 += (token1.data.width - 1) * gridSize;
    }
    else if (isRightOf) {
        x2 += (token2.data.width - 1) * gridSize;
    }
    else {
        x2 = x1;
    }

    if (isAbove) {
        y1 += (token1.data.height - 1) * gridSize;
    }
    else if (isBelow) {
        y2 += (token2.data.height - 1) * gridSize;
    }
    else {
        y2 = y1;
    }

    const ray = new Ray({ x: x1, y: y1 }, { x: x2, y: y2 });
    const distance = canvas.grid.grid.measureDistances([{ ray }], { gridSpaces: true })[0];
    return minFeet <= distance && distance <= maxFeet;
}

const isMouser = (token) => token.actor.data.items.some(x => x.name === 'Swashbuckler (Mouser)');
const hasOutflank = (token) => token.actor.data.items.some(x => x.name.toLowerCase().includes('outflank'));
const hasGangUp = (token) => token.actor.data.items.map(x => x.name.toLowerCase()).some(name => name.includes('gang up') || name.includes('gangaup'));
const hasMenacing = (token) => token.actor.data.items.some(x => x.type === 'weapon' && x.data.data.equipped && x.name.toLowerCase().includes('menacing'));
const isRatfolk = (token) => token.actor.data.items.some(x => x.type === 'race' && x.name === 'Ratfolk');
const isThreatening = (token1, token2) => {
    const attacks = token1.actor.items.filter(x => x.type === 'attack' && (x.data.data.range.units === 'melee' || x.data.data.range.units === 'reach'));
    const naturalAttacks = attacks.filter(x => x.data.data.attackType === 'natural');

    if (naturalAttacks.some(na => isWithinRange(token1, token2, 0, na.range))) {
        return true;
    }

    const attackIdsForEquippedWeapons = token1.actor.items
        .filter(x => x.type === 'weapon' && x.data.data.equipped && x.data.data.weaponSubtype !== 'ranged')
        .flatMap(x => x.data.data.links.children).map(x => x.id);

    const weaponAttacks = attacks
        .filter(attack => attack.data.attackType !== 'natural' && attackIdsForEquippedWeapons.includes(attack.id));

    const weapons = weaponAttacks.filter(x => x.data.data.range.units === 'melee' || x.name.toLowerCase().includes('whip'));
    for (let i = 0; i < weapons.length; i++) {
        const weapon = weapons[i];
        if (isWithinRange(token1, token2, 0, weapon.range)) {
            return true;
        }
    }

    const reachAttacks = weaponAttacks.filter(x => x.data.data.range.units === 'reach');
    for (let i = 0; i < reachAttacks.length; i++) {
        const reach = reachAttacks[i];
        if (!isAdjacent(token1, token2) && isWithinRange(token1, token2, reach.range / 2, reach.range)) {
            return true;
        }
    }

    return false;
};

const handleFlanking = async (meToken, targetToken) => {
    await turnOffFlankAsync(meToken);
    if (!targetToken || !canBeFlanked(targetToken) || !isThreatening(meToken, targetToken)) {
        return;
    }

    let bestFlankId = null;
    const setBestFlank = (flankFriend) => {
        const outflank = hasOutflank(meToken) && hasOutflank(flankFriend);
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

    const friends = canvas.tokens.placeables.filter(t => t.data.disposition === meToken.data.disposition && t.data._id !== meToken.data._id);
    await Promise.all(friends.map(async (friend) => {

        // todo hunter and pet

        if (targetToken === friend) {
            // continue;
        }
        else if (isRatfolk(meToken)
            && isRatfolk(friend)
            && isSharingSquare(meToken, friend)
            && isThreatening(friend, targetToken)
        ) {
            setBestFlank(friend);
        }
        else if (isMouser(friend)
            && isAdjacent(meToken, friend)
            && isSharingSquare(friend, targetToken)
            && isThreatening(friend, targetToken)
        ) {
            setBestFlank(friend);
        }
        else if (isMouser(meToken)
            && isAdjacent(meToken, friend)
            && isSharingSquare(meToken, targetToken)
            && isThreatening(friend, targetToken)
        ) {
            setBestFlank(friend);
        }
        else if (isThreatening(friend, targetToken)
            && isFlanking(meToken, friend, targetToken)
        ) {
            setBestFlank(friend);
        }

        if (hasGangUp(friend) && isThreatening(friend, targetToken)) {
            gangUpFriends.push(friend);
        }
    }));

    if (gangUpFriends.length >= 3) {
        gangUpFriends.forEach(f => setBestFlank(f));
    }

    if (bestFlankId) {
        await turnOnBuffAsync(meToken, bestFlankId);
    }
};

Hooks.once('init', () => {
    Hooks.on('updateToken', async (token, update, _options, _userId) => {
        if (update?.hasOwnProperty('x') || update?.hasOwnProperty('y')) {

            const allTokens = canvas.tokens.objects.children;
            const allTargeted = allTokens.filter(x => x.targeted?.size != null);
            const targetedByMe = [];
            allTargeted.forEach(at => {
                at.targeted.forEach(att => {
                    if (att === game.user) {
                        targetedByMe.push(at);
                    }
                });
            });

            if (!targetedByMe.length) {
                return;
            }

            const myTokens = canvas.tokens.objects.children.filter(x => x.isOwner);

            // if I move
            if (myTokens.some(x => x.id === token.id)) {
                const fullToken = canvas.tokens.get(token.id);

                await Promise.all(targetedByMe.map(async (targetToken) => {
                    await handleFlanking(fullToken, targetToken);
                }));
            }
            // else if my target moves
            else if (targetedByMe.some(x => x.id === token.id)) {
                const myMovingTargetedToken = targetedByMe.find(x => x.id === token.id);
                const myTokens = canvas.tokens.objects.children.filter(x => x.isOwner);

                await Promise.all(myTokens.map(async (myToken) => {
                    myToken.data.x;
                    myToken.data.y;

                    await handleFlanking(myToken, myMovingTargetedToken);
                }));
            }
            // else if a friendly player that I could be flanking with moves
            // todo
        }
    });

    Hooks.on("targetToken", async (user, targetToken, targetted) => {
        if (user !== game.user) {
            return;
        }

        let meToken;
        if (user.isGM) {
            meToken = canvas.tokens.controlled[0];
        } else {
            meToken = user.character?.getActiveTokens()[0];
        }
        if (!meToken || meToken == targetToken) {
            return;
        }

        if (!targetted) {
            await turnOffFlankAsync(meToken);
            return;
        }

        await handleFlanking(meToken, targetToken);
    });
});
