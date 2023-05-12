

// top left of the map is (0,0)

const _left = (token) => token.x;
const _isLeftOf = (token, target) => _right(token) <= _left(target);

const _right = (token) => token.x + token.w;
const _isRightOf = (token, target) => _left(token) >= _right(target);

const _top = (token) => token.y;
const _isAbove = (token, target) => _bottom(token) <= _top(target);

const _bottom = (token) => token.y + token.h;
const _isBelow = (token, target) => _top(token) >= _bottom(target);

const _isSharingSquare = (token1, token2) =>
    _left(token1) >= _left(token2)
    && _top(token1) >= _top(token2)
    && _right(token1) <= _right(token2)
    && _bottom(token1) <= _bottom(token2);
const isSharingSquare = (token1, token2) =>
    _isSharingSquare(token1, token2) || _isSharingSquare(token2, token1);

/**
 * calculate center of each square of the token
 * @param {*} token
 * @returns
 */
const _centers = (token) => {
    const sizeScale = token.actor.system.traits.size;
    const size = pf1.config.sizeMods[sizeScale] >= 2
        ? 1
        : pf1.config.tokenSizes[sizeScale].w;

    const centers = [];

    const gridSize = token.scene.grid.size;
    const offset = (i) => -(gridSize / 2) + (i + 1) * gridSize;

    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            centers.push({ x: token.x + offset(x), y: token.y + offset(y) });
        }
    }

    return centers;
}

const getEmptyAdjacentMeSquares = (token) => {
    // todo clone myself for each adjacent square and (plus grid size from each of my left/top/right/bottom per my size) and return an array with updated x/y
    // look into PlaceablesLayer.selectObjects({x,y,width,height})
    // look into BaseGrid.getNeighbors(row, col)
    return [];
}

const isAdjacent = (token1, token2) => {
    // is above or below target
    if ((_left(token1) >= _left(token2) && _right(token1) <= _right(token2))
        || _right(token1) >= _right(token2) && _left(token1) <= _left(token2)
    ) {
        if (_top(token1) == _bottom(token2) || _bottom(token1) == _top(token2)) {
            return true;
        }
    }

    // is left or right of target
    if ((_bottom(token1) >= _bottom(token2) && _top(token1) <= _top(token2))
        || _top(token1) >= _top(token2) && _bottom(token1) <= _bottom(token2)
    ) {
        if (_left(token1) == _right(token2) || _right(token1) == _left(token2)) {
            return true;
        }
    }

    // is diagonally adjacent to target
    if (_left(token1) == _right(token2) || _right(token1) == _left(token2)) {
        if (_top(token1) == _bottom(token2) || _bottom(token1) == _top(token2)) {
            return true;
        }
    }

    // if none of the above, return true if sharing the same square as adjacent is basically defined as "one square or closer"
    return isSharingSquare(token1, token2);
}

const isFlanking = (token1, token2, targetToken) => {
    // todo verify if diagonally opposite works

    const { bounds } = targetToken;
    const { leftB, rightB, topB, bottomB } = bounds;

    const left = new Ray({ x: leftB, y: topB }, { x: leftB, y: bottomB });
    const right = new Ray({ x: rightB, y: topB }, { x: rightB, y: bottomB });
    const top = new Ray({ x: leftB, y: topB }, { x: rightB, y: topB });
    const bottom = new Ray({ x: leftB, y: bottomB }, { x: rightB, y: bottomB });

    const onOppositeSides = (t1, t2) => {
        const intersectsSide = (side) => lineSegmentIntersects(t1, t2, side.A, side.B);

        return (intersectsSide(left) && intersectsSide(right)) || (intersectsSide(top) && intersectsSide(bottom));
    };

    const centersT1 = _centers(token1);
    const centersT2 = _centers(token2);

    return centersT1.some((ct1) => centersT2.some((ct2) => onOppositeSides(ct1, ct2)));
}

const isWithin10FootDiagonal = (token1, token2) => {
    // todo verify x/y h/w
    const t1 = (x, y) => ({ x, y, h: token1.h, w: token1.w });
    // todo - verify this method
    // add "1 square (gridSize)" in all diagonals and see if adjacent
    if (isAdjacent(t1(_left(token1) - gridSize, _top(token1) - gridSize), token2)
        || isAdjacent(t1(_left(token1) - gridSize, _bottom(token1) + gridSize), token2)
        || isAdjacent(t1(_right(token1) + gridSize, _top(token1) - gridSize), token2)
        || isAdjacent(t1(_right(token1) + gridSize, _bottom(token1) + gridSize), token2)
    ) {
        return true;
    }

    return false;
}

const isWithinRange = (token1, token2, minFeet, maxFeet) => {
    if (minFeet === 0 && isSharingSquare(token1, token2)) {
        return true;
    }

    const scene = game.scenes.active;
    const gridSize = scene.grid.size;

    if (maxFeet === 10 && isWithin10FootDiagonal(token1, token2)) {
        return true;
    }

    // canvas.grid.grid.measureDistances([{ray: ray}], {gridSpaces: true})[0]

    let x1 = _left(token1);
    let x2 = _left(token2);
    let y1 = _top(token1);
    let y2 = _top(token2);

    if (_isLeftOf(token1, token2)) {
        // x1 += (token1.data.width - 1) * gridSize;
        x1 += token1.w - gridSize;
    }
    else if (_isRightOf(token1, token2)) {
        // x2 += (token2.data.width - 1) * gridSize;
        x2 += token2.w - gridSize;
    }
    else {
        x2 = x1;
    }

    if (_isAbove(token1, token2)) {
        // y1 += (token1.data.height - 1) * gridSize;
        y1 += token1.h - gridSize;
    }
    else if (_isBelow(token1, token2)) {
        // y2 += (token2.data.height - 1) * gridSize;
        y2 += token2.h - gridSize;
    }
    else {
        y2 = y1;
    }

    const ray = new Ray({ x: x1, y: y1 }, { x: x2, y: y2 });
    const distance = canvas.grid.grid.measureDistances([{ ray }], { gridSpaces: true })[0];
    return minFeet <= distance && distance <= maxFeet;
}

export {
    getEmptyAdjacentMeSquares,
    isAdjacent,
    isFlanking,
    isSharingSquare,
    isWithinRange,
}
