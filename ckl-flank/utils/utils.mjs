export const amILowestOwner = (token) => {
    const ownership = token.actor?.ownership;
    if (!ownership) {
        return false;
    }

    const activeUsers = [...game.users]
        .filter(x => x.active)
        .sort((x, y) => {
            if (x.isGM === y.isGM) {
                const idCompare = x.id > y.id ? 1 : -1;
                return idCompare;
            }

            if (x.isGM) {
                return 1;
            }

            return -1;
        });

    const owner = foundry.CONST.DOCUMENT_PERMISSION_LEVELS.OWNER;
    const owners = activeUsers.filter((user) => typeof ownership[user.id] === 'number' && ownership[user.id] === owner);
    return owners[0].id === game.userId;
}
