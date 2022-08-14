import { MODULE_NAME } from "../consts.mjs";

const isEmptyObject = (obj) => !Object.keys(obj).length;

const localize = (key, opts = {}) =>
    isEmptyObject(opts)
        ? game.i18n.localize(`${MODULE_NAME}.${key}`)
        : game.i18n.format(`${MODULE_NAME}.${key}`, opts);

const localizeFull = (key, opts = {}) =>
    isEmptyObject(opts)
        ? game.i18n.localize(key)
        : game.i18n.format(key, opts);

export { localize, localizeFull };
