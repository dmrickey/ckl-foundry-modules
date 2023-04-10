# Stub Module

The Sihedron is a powerful artifact in PF1 lore. The star has 7 points associated with it and with each point a powerful buff.

This mod aims to automate most of what it can. It provides its own copy of the artifact in its compendium that you can give to the players. This was originally copied from the PF1 content mod. This version comes preconfigured with some script calls that call into the code provided by this mod to provide specific functionality. Whenever you use the star, it prompts a menu that lets you choose a specific buff, or give it to another player's token. When you already have one of the points active and activate the star, it will not let you swap directly to one of the opposing buffs (per the star's description). When you choose to give the star to another player, both actors are appropriately healed and both are given an appropriate buff for when the star is swapped.

Shortcomings - right now there is quick and easy way to automate giving the players the SLAs associated with each point of the star. So instead of checking if the user has various spellbooks configured, or trying to coerce each different spell into a feature that can be used, the spell is linked in the buffs description. From here you can simply drag the spell onto your actor in whatever way makes sense (i.e. into which spellbook works for you). You can also drag the spell from the chat card printed when the star is activated.

In the next release of PF1 I can put out an update that will make this much better. In the next version, buffs will be able to have their own actions. So when the next version comes out, I can publish an update that has these SLAs pre-configured on each buff.

The mod is preconfigured for art in your root data folder. The names are listed below. You'll notice the names are sins instead of virtues, this is because each sin is a twist of the virtue, and each of the artifacts these files were named after are (in lore) the literal points of the Sihedron after it was broken--so it made sense to me to use these points as the art for the buffs the point represents. I pulled these art files directly from the Shattered Star PDF, so I cannot include these with the mod.
- `Shard of Envy.png`
- `Shard of Gluttony.png`
- `Shard of Greed.png`
- `Shard of Lust.png`
- `Shard of Pride.png`
- `Shard of Sloth.png`
- `Shard of Wrath.png`
- `Sihedron.png`

### Installation

This module is not in the foundry browser--so searching will not find it. At the bottom of the "Install Module" dialog, just use this manifest url at the bottom of the dialog
- https://github.com/dmrickey/ckl-foundry-modules/raw/main/ckl-roll-bonuses/module.json

## Required Modules

### Warp Gate

- This mod makes it very easy to show complex dialog boxes. It is used for the prompt for giving the star to another player or choosing which buff you want
- https://foundryvtt.com/packages/warpgate
### socketlib

- This mod allows the sihedron to be given to other players and makes it so that the dialog prompt for choosing a buff shows up for the right player. Without this mod, the dialog would only show up for the GM when the star is given to a player
- https://foundryvtt.com/packages/socketlib

## Strongly Suggested Modules (but not technically required)

### Koboldworks – Health Over Time ❣️ for Pathfinder 1e

- This mod allows the Fast Healing of both the Sihedron and the Temperence buff to work (it's preconfigured, and works automatically once the mod is installed)
- https://gitlab.com/mkah-fvtt/pf1/regen/-/tree/master
- https://gitlab.com/mkah-fvtt/pf1/regen/-/releases/permalink/latest/downloads/module.json

## License

See the included MIT license.
