import { MODULE_NAME } from "../consts.mjs";
import { localize } from "./localize.mjs";

export const registerSetting = ({
    key,
    defaultValue,
    scope = 'world',
    settingType = String
}) =>
    Hooks.once('ready', () => {
        defaultValue ||= localize(`settings.${key}.default`);
        game.settings.register(MODULE_NAME, key, {
            name: `${MODULE_NAME}.settings.${key}.name`,
            hint: `${MODULE_NAME}.settings.${key}.hint`,
            default: defaultValue,
            scope,
            requiresReload: false,
            config: true,
            type: settingType
        })
    });
