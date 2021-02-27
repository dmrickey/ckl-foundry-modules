const createData = {
	name: "Flanking",
	type: "buff",
	"data.buffType": "misc",
	"data.active": true,
	"data.changes": [ { _id: randomID(8), "formula": "2", "operator": "add", "target": "attack", "subTarget": "mattack", "modifier": "untyped", "priority": 0, "value": 0 } ]
};

// top left of the map is (0,0)

const left = (token) => token.data.x;
const right = (token) => token.data.x + token.w;
const top = (token) => token.data.y;
const bottom = (token) => token.data.y + token.h;

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

	// if none of the above, return true if sharing the same square as adjacent is basically defined as "one quare or closer"
	return isSharingSquare(token1, token2);
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

const getBuffNameAsync = async (id) => {
	const pack = game.packs.get("flank-ckl.flank-ckl");
	if (!pack.index.length) {
		await pack.getIndex();
	}
	return pack.index.find(x => x._id === id).name;
}

const getBuffDataAsync = async (id) => {
	const pack = game.packs.get("flank-ckl.flank-ckl");
	if (!pack.index.length) {
		await pack.getIndex();
	}
	const buff = await pack.getEntity(id);
	return duplicate(buff.data);
}

const turnOnBuffAsync = async (token, buffId) => {
	const buffName = await getBuffNameAsync(buffId);
	const item = token.actor.items.find(i => i.type === "buff" && i.name === buffName);
	if (!item) {
		const buff = await getBuffDataAsync(buffId);
		buff.data.active = true;

		// todo verify if async or not
		token.actor.createOwnedItem(buff);
	}
	else {
		await item.update({ "data.active": true });
	}
}

const turnOffFlankAsync = async (token) => {
	await Promise.all(allBuffIds.map(async (id) => {
		const buffName = await getBuffNameAsync(id);
		const item = token.actor.items?.find(i => i.type === "buff" && i.name === buffName);
		if (item) {
			await item.update({ "data.active": false });
		}
	}));
}

const isWithinRange = (token1, token2, minFeet, maxFeet) => {
	if (minFeet === 0 && isSharingSquare(token1, token2)) {
		return true;
	}

	const scene = game.scenes.active;
	const gridSize = scene.data.grid;

	if (maxFeet === 10) {
		const t1 = (x, y) => ({ data: { x, y }, h: token1.h, w: token1.w});
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

	if (isAbove) {
		y1 += (token1.data.height - 1) * gridSize;
	}
	else if (isBelow) {
		y2 += (token2.data.height - 1) * gridSize;
	}

	const ray = new Ray({ x: x1, y: y1 }, { x: x2, y: y2 });
	const distance = canvas.grid.grid.measureDistances([{ray}], {gridSpaces: true})[0];
	return minFeet <= distance && distance <= maxFeet;
}

const isMouser = (token) => token.actor.data.items.some(x => x.name === 'Swashbuckler (Mouser)');
const hasOutflank = (token) => token.actor.data.items.some(x => x.name.toLowerCase().includes('outflank'));
const hasGangUp = (token) => token.actor.data.items.map(x => x.name.toLowerCase()).some(name => name.includes('gang up') || name.includes('gangaup'));
const hasMenacing = (token) => token.actor.data.items.some(x => x.type === 'weapon' && x.data.equipped && x.name.toLowerCase().includes('menacing'));
const isRatfolk = (token) => token.actor.data.items.some(x => x.type === 'race' && x.name === 'Ratfolk');
const isThreatening = (token1, token2) => {
	const attacks = token1.actor.items.filter(x => x.type === 'attack' && (x.data.data.range.units === 'melee' || x.data.data.range.units === 'reach'));
	const naturalAttacks = attacks.filter(x => x.data.attackType === 'natural');

	if (naturalAttacks.some(na => isWithinRange(token1, token2, 0, na.range))) {
		return true;
	}

	const attackIdsForEquippedWeapons = token1.actor.items
		.filter(x => x.type === 'weapon' && x.data.data.equipped && x.data.data.weaponSubtype !== 'ranged')
		.flatMap(x => x.data.data.links.children).map(x => x.id);
	
	const weaponAttacks = attacks
		.filter(attack => attack.data.attackType !== 'natural' && attackIdsForEquippedWeapons.includes(attack.id));

	const whips = weaponAttacks.filter(x => x.data.data.range.units === 'melee' || x.name.toLowerCase().includes('whip'));
	for (let i = 0; i < whips.length; i++) {
		const whip = whips[i];
		if (isWithinRange(token1, token2, 0, whip.range)) {
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
	if (!targetToken || !isThreatening(meToken, targetToken)) {
		await turnOffFlankAsync(meToken);
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
		else if (isThreatening(friend, targetToken)) {
			// Set up coordinates of every edge of the targetted token
			const tLeft = left(targetToken);
			const tRight = right(targetToken);
			const tTop = top(targetToken);
			const tBottom = bottom(targetToken);
			const targetTokenBounds = [
				[tLeft, tTop, tRight, tTop],
				[tRight, tTop, tRight, tBottom],
				[tRight, tBottom, tLeft, tBottom],
				[tLeft, tBottom, tLeft, tTop]
			];

			const betweenRay = new Ray(meToken.center, friend.center);
			const checkIntersect = targetTokenBounds.map(b => betweenRay.intersectSegment(b));

			if (checkIntersect[0] && checkIntersect[2] || checkIntersect[1] && checkIntersect[3]) {
				setBestFlank(friend);
			}
		}

		if (hasGangUp(friend) && isThreatening(friend, targetToken)) {
			gangUpFriends.push(friend);
		}
	}));

	if (gangUpFriends.length >= 3) {
		gangUpFriends.forEach(f => setBestFlank(f));
	}

	if (bestFlankId) {
		await turnOffFlankAsync(meToken);
		await turnOnBuffAsync(meToken, bestFlankId);
	}
};

Hooks.once('init', () => {
	Hooks.on('updateToken', async (scene, token, update, { diff }) => {
		if (diff && (update?.hasOwnProperty('x') || update?.hasOwnProperty('y'))) {
			const fullToken = canvas.tokens.get(token._id);
			await turnOffFlankAsync(fullToken);

			if (update?.hasOwnProperty('x')) {
				fullToken.data.x = update.x;
			}
			if (update?.hasOwnProperty('y')) {
				fullToken.data.y = update.y;
			}

			const allTokens = canvas.tokens.objects.children;
			const allTargeted = allTokens.filter(x => x.targeted?.size);
			const targetedByMe = [];
			allTargeted.forEach(at => {
				at.targeted.forEach(att => {
					if (att === game.user) {
						targetedByMe.push(at);
					}
				});
			});
			
			await Promise.all(targetedByMe.map(async (targetToken) => {
				await handleFlanking(fullToken, targetToken);
			}));
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