import { truthiness } from "./truthiness.mjs";

let itemHintsAPI;

const funcs = [];

/**
 * @param {Actor} actor
 * @param {Item} item
 * @param {Object} data
 * @returns {undefined|Hint[]}
 */
function itemHintsHandler(actor, item, data) {
    const hintcls = itemHintsAPI.HintClass;
    const hints = funcs.flatMap((func) => func(hintcls, actor, item, data));
    return hints.filter(truthiness);
}

function itemHintsRegistration() {
    const itemHintsModule = game.modules.get('mkah-pf1-item-hints');
    if (itemHintsModule?.active) {
        itemHintsAPI = itemHintsModule.api;
        itemHintsAPI.addHandler(itemHintsHandler);
    }
}

export const registerItemHint = (func) => funcs.push(func);

export const init = () => Hooks.once('ready', itemHintsRegistration);
