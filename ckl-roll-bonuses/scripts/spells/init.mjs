
Hooks.on('actorRoll', (actor, type, id, options) => {
    if (!['cl', 'concentration'].includes(type)) {
        return;
    }

    // todo do stuff
});
