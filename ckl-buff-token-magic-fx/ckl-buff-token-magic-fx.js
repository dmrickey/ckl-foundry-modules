const log = console.log;

const namespace = 'ckl-buff-token-magic-fx';
const prop = 'buff-token-magic-fx'

Hooks.once('init', () => {
    Hooks.on('renderItemSheetPF', async (itemPFSheet, jq) => {
        log('ckl - hook - renderItemSheetPF', itemPFSheet);
        const item = itemPFSheet?.object;

        if (item) {
            const beforeElement = jq.find('div.tab.details h4:last-of-type');
            if (beforeElement) {
                if (item.type === 'buff') {
                    const fxString = item.getFlag(namespace, prop) || '';
                    const fxInputClass = 'ckl-buff-token-magic-fx-input';

                    const onFxInputChanged = async (event) => {
                        await item?.setFlag(namespace, prop, event.target.value);
                    };

                    const macroInput =
                        '<h3 class="form-header">Buff Token Magic FX</h3>' + 
                        '<div class="form-group">' +
                            '<label>FX Name</label>' +
                            `<input value="${fxString}" data-dtype="String" type="text" placeholder="Name of effect (multiple can be separated by commas/semicolons)" class="${fxInputClass}">` + 
                        '</div>';
                    beforeElement.before(macroInput);

                    const input = jq.find(`.${fxInputClass}`);
                    input.on('change', onFxInputChanged.bind());
                }
            }
        }
    });

    Hooks.on('updateOwnedItem', async (actor, item, update) => {
        log('ckl - hook - updateOwnedItem', actor, item);
        if (item?.type !== 'buff') {
            return;
        }

        if (update?.data?.hasOwnProperty('active')) {
            const myToken = canvas.tokens.ownedTokens.find(x => x.actor.id === actor.id);

            const fxString = item.flags[namespace]?.[prop];

            if (myToken && fxString) {
                const func = update.data.active ? TokenMagic.addFilters : TokenMagic.deleteFilters;

                let fxs = fxString.split(',').map(x => x.split(';'));
                fxs = [].concat(...fxs).map(x => x.trim());
                for (let i = 0; i < fxs.length; i++) {
                    const fx = fxs[i];
                    await func(myToken, fx);
                }
            }
        }
    });
});
