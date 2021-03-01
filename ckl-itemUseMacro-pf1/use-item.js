const log = console.log;

const namespace = 'ckl-itemUseMacro-pf1';

const activatedName = 'onActivatedMacroName';
const deactivatedName = 'onDeactivatedMacroName';
const useName = 'macroName';

const getMacros = (item, prop) => {
    const m = item.getFlag(namespace, prop) || '';
    let macros = m.split(',').map(x => x.split(';'));
    return [].concat(...macros).map(x => x.trim());
}

const getUseMacros = (item) => getMacros(item, useName);
const setUseMacros = async (item, macros) => await item?.setFlag(namespace, useName, macros);

const getBuffActivatedMacros = (item) => getMacros(item, activatedName);
const setBuffActivatedMacros = async (item, macros) => await item?.setFlag(namespace, activatedName, macros);

const getBuffDeactivatedMacros = (item) => getMacros(item, deactivatedName);
const setBuffDeactivatedMacros = async (item, macros) => await item?.setFlag(namespace, deactivatedName, macros);


const callMacro = async (macroName, macroData) => {
    let macroCommand;
    let macro = macroName.trim();
    try {
        if (macro) {
            macroCommand = game.macros.getName(macro);
        }
        if (macroCommand) {
            try {
                return macroCommand.execute(macroData) || {};
            }
            catch (err) {
                console.warn("ckl-itemUseMacro-pf1 | callMacro failed: ", err);
            }
        }
    }
    catch (err) {
        console.warn("Macro execution failed ", err);
    }
    return {};
};

Hooks.once('init', () => {
    log('ckl - init');

    // type can be "attack"
	// Hooks.on('itemUse', async (item, type, { skipDialog }) => {
    //     const flags = item?.data?.flags;
    //     if (flags?.['ckl-use-item-macro']) {
    //         const macros = flags['ckl-use-item-macro'];
    //         macros.forEach(m => game.macros.getName(m)?.execute());
    //     }
    // });

    Hooks.on('renderItemSheetPF', async (itemPFSheet, jq) => {
        log('ckl - hook - renderItemSheetPF', itemPFSheet);
		const item = itemPFSheet?.object;

        if (item) {

            const detailsTab = jq.find('div.tab.details');
            if (detailsTab) {
                if (item.type === 'buff') {
                    const activateMacrosString = item.getFlag(namespace, activatedName) || '';
                    const deactivateMacrosString = item.getFlag(namespace, deactivatedName) || '';
                    const activatedMacroInputClass = 'ckl-buffActivatedMacro';
                    const deactivatedMacroInputClass = 'ckl-buffDeactivatedMacro';
    
                    const onActivateInputChanged = async (event) => {
                        await setBuffActivatedMacros(item, event.target.value);
                    };
                    const onDeactivateInputChanged = async (event) => {
                        await setBuffDeactivatedMacros(item, event.target.value);
                    };

                    const macroInput =
                        '<h3 class="form-header">Activation Macros</h3>' + 
                        '<div class="form-group">' +
                            '<label>On Activated Macro</label>' +
                            `<input value="${activateMacrosString}" data-dtype="String" type="text" placeholder="Name of macro (multiple can be separated by commas/semicolons)" class="${activatedMacroInputClass}">` + 
                        '</div>' +
                        '<div class="form-group">' +
                            '<label>On Deactivated Macro</label>' +
                            `<input value="${deactivateMacrosString}" data-dtype="String" type="text" placeholder="Name of macro (multiple can be separated by commas/semicolons)" class="${deactivatedMacroInputClass}">` + 
                        '</div>';
                    detailsTab.append(macroInput);

                    const aInput = jq.find(`.${activatedMacroInputClass}`);
                    aInput.on('change', onActivateInputChanged.bind());

                    const dInput = jq.find(`.${deactivatedMacroInputClass}`);
                    dInput.on('change', onDeactivateInputChanged.bind());
                }
                else {
                    const onMacroInputChanged = async (event) => {
                        await setUseMacros(item, event.target.value);
                    };

                    const macrosString = item.getFlag(namespace, useName) || '';
                    const clazz = 'ckl-itemUseMacro';
                    const macroInput =
                        '<h3 class="form-header">On Use Macro</h3>' + 
                        '<div class="form-group">' +
                            '<label>Macro Name</label>' +
                            `<input value="${macrosString}" data-dtype="String" type="text" placeholder="Name of macro (multiple can be separated by commas/semicolons)" class="${clazz}">` + 
                        '</div>';
                    detailsTab.append(macroInput);

                    const input = jq.find(`.${clazz}`);
                    input.on('change', onMacroInputChanged.bind());
                }
            }
        }
    });

    // const macroArgs {
    //     targets,
    //     tokenId,
    //     item
    // }

    Hooks.on('createChatMessage', async (chatMessagePF) => {
        log('ckl - hook - createChatMessage', chatMessagePF);
        const item = chatMessagePF?.itemSource;
        const actor = item?.options?.actor;
        const macrosString = getUseMacros(item);
        if (actor?.id && macrosString) {
            const myToken = canvas.tokens.ownedTokens.find(x => x.actor.id === actor.id);

            const allTokens = canvas.tokens.objects.children;
			const allTargeted = allTokens.filter(x => x.targeted?.size);
			const targetedByMe = [];
			allTargeted.forEach(at => {
				at.targeted.forEach(att => {
					if (att === game.user) {
						targetedByMe.push({ _id: at.data._id });
					}
				});
			});

            item.data.source = '';
            const args = {
                actor,
                item,
                targets: targetedByMe,
                tokenId: myToken?.id,
            }

            let macros = macrosString.split(',').map(x => x.split(';'));
            macros = [].concat(...macros).map(x => x.trim());
            for (let i = 0; i < macros.length; i++) {
                const macro = macros[i];
                await callMacro(macro, args);
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
            const args = {
                actor,
                tokenId: myToken?.id,
            };

            const macrosString = item.flags[namespace][update.data.active ? activatedName : deactivatedName];
            let macros = macrosString.split(',').map(x => x.split(';'));
            macros = [].concat(...macros).map(x => x.trim());
            for (let i = 0; i < macros.length; i++) {
                const macro = macros[i];
                await callMacro(macro, args);
            }
        }
    });
});
