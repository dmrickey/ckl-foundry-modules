import { truthiness } from "./truthiness.mjs";


/**
 * @type {ItemHintsAPI}
 */
let itemHintsAPI;

/**
 * @type {(HintFunc)[]}
 */
const funcs = [];

/**
 * @param {ActorPF} actor
 * @param {ItemPF} item
 * @param {Object} data
 * @returns {Hint[]}
 */
function itemHintsHandler(actor, item, data) {
    const hintcls = itemHintsAPI.HintClass;
    const hints = funcs
        .flatMap((func) => func)
        .map((func) => func(hintcls, actor, item, data));
    return hints.filter(truthiness);
}

function itemHintsRegistration() {
    const itemHintsModule = game.modules.get('mkah-pf1-item-hints');
    if (itemHintsModule?.active) {
        itemHintsAPI = itemHintsModule.api;
        itemHintsAPI.addHandler(itemHintsHandler);
    }
}

Hooks.once('ready', itemHintsRegistration);

/**
 * @param {HintFunc} func
 */
export const registerItemHint = (func) => funcs.push(func);
