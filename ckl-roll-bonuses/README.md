# Roll Bonuses

## Skill Bonuses
![image](https://user-images.githubusercontent.com/3664822/183241183-9f899996-6f2a-455a-a711-054039365d31.png)

On the skills tab in the top right is a button for modifying your base inspiration die. It defaults to `1d6[Inspiration]`, it's modifiable here because investigators get the option of changing it to a d8 later, or even rolling twice and taking the higher.

To the right of each skill there's now a cog you can click that will open a menu:

- Override the base die (only thing I know of that does this is the `Empathy` investigator talent that let's them roll twice and keep the higher, but there could be something else out there, or any homebrew rules)
- Bonus is for any other permanent bonuses you have that need a die roll
- the checkbox reads the global skill config inspiration value

If you have static bonuses, use the built in change system -- this is only necessary to cover a limitation in that you can't have changes based on die rolls -- they're cachced when the buff is turned on. So if you have a 1d6 in a change, and turn the buff on, then it rolls immediately when you turn the buff on and keeps that specific value until the buff is toggled later.

## Spell Focus
![image](https://user-images.githubusercontent.com/3664822/216522228-0968c234-3b89-47c0-b0e9-addf9accad34.png)

Spell Focus, Greater Spell Focus, and Mythic Spell Focus now all have a drop down on the advanced tab that lets you select a school. When you cast a spell of that school, the DC will automatically be increased.
- The feat name has to match the mod configuration (already set up to match the expected English feat names) _*or*_ if it's one of those two feats added to your character sheet from the compendium (it doesn't matter if it's been renamed if it was added from a compendium).
  - If the drop down doesn't show up because the name does not exactly match, or some other reason, you can still add a dictionary flag with the name `spellFocus`/`greaterSpellFocus` and the mod will automatically add the inputs for you below the dictionary flags section.
  - Also handles Mythic Spell Focus, if the auto-dropdown doesn't show up, you can add the flag `mythicSpellFocus` following the same rules outline above
- Greater and Mythic options in the dropdown are limited by choices you've made for spell focus. If you want to get around that dropdown limitation, the flag can be manually added per above.
- Because of a bug in pf1 0.82.5, the save button on the chat card will show the correct DC, but the info note at the bottom of the chat card will your base DC -- this is the same bug that happens if you use a conditional modifier to increase an individual spell's DC.

## Elemental Focus
Follows the same basic setup as Spell Focus above.
- You can manually configure it by setting a flag on the feat with a key of `elementalFocus`, `greaterElementalFocus`, or `mythicElementalFocus` and the mod will automatically add the inputs for you below the dictionary flags section.
- The accepted values are `acid`, `cold`, `electric`, or `fire`.
- The damage for the spell you're casting must be configured using one of the system's predefined types.

## Spell DC Bonuses (and penalties)
Add a new dFlag on any item named `genericSpellDC`, then drop in a number (positive or negative) or a formula and when you next cast a spell on that Actor the DC should be adjusted accordingly.

##  Caster Level Offset for specified Magic School
Has a formula input which accepts roll data variables plus a dropdown for selecting the school of magic.
- You must add a dictionary flag `schoolClOffset` to your buff/feature/etc. Once you add that, the inputs will show up below.

TODO
- add the formula class to skill inputs
- consumable buffs - requires foundry v10 / pf1 0.83.0
    - idea is to create a a flag on a buff that will add the bonus in "prehook" (and/or use built in changes) but use the new pf1 v.next posthook to disable the buff when it is consumed
- Air Affinity: Sylph sorcerers with the elemental (air) bloodline treat their Charisma scores as 2 points higher for the purposes of all sorcerer spells and class abilities
    - Specifically just "treat <ability score> higher/lower for <spell book>"
    - maybe also "treat <ability score> higher/lower for <class ability>" -- would need to be based off of class key and ability that has a parent as that class
