import { MODULE_NAME } from "../consts.mjs";
import { localize } from "./localize.mjs";

export const registerSettingString = ({ key, scope = 'world' }) =>
    Hooks.once('ready', () => game.settings.register(MODULE_NAME, key, {
        name: `${MODULE_NAME}.settings.${key}.name`,
        hint: `${MODULE_NAME}.settings.${key}.hint`,
        default: localize(`settings.${key}.default`),
        scope,
        requiresReload: false,
        config: true,
    }));
