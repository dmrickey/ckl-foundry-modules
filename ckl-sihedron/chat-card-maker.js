export const createHealCard = (item, actor, token, roll) => {
    const content = `<div class="pf1 chat-card item-card" data-actor-id="${actor.id}" data-item-id="${item.id}" data-token-uuid="Scene.${canvas.scene.id}.Token.${token.id}">
        <header class="card-header flexrow" style="background-image: linear-gradient(to right, rgb(137, 0, 234), rgb(95, 0, 163));">
            <img src="${item.img}" title="${item.name}" width="36" height="36">
            <h3 class="item-name" style="color: white;">${item.name}</h3>
        </header>

        <div class="card-content" style="display: none;">
            ${item.fullDescription}
        </div>

        <div class="chat-attack" data-index="0">
            <table>
                <thead>
                    <tr>
                        <th class="attack-damage" colspan="2">
                            Healed
                            <a class="attack-damage total fake-inline-roll inline-result" title="Total">
                            ${roll.formula} -> ${roll.total}
                            </a>
                        </th>
                    </tr>
                </thead>

                <tbody>
                    <tr>
                        <td class="lil-melded-type" colspan="2">
                            <a class="inline-roll inline-dsn-hidden inline-result lil-roll-restyle poor-roll middling-roll lil-melded-roll" title="2d6" data-roll="${escape(JSON.stringify(roll))}" data-roll-grade="4">
                                <i class="fas fa-dice-d20"></i> ${roll.total}
                            </a>
                            &nbsp;Positive<i class="fas fa-seedling lil-damage-type" style="color: white; text-shadow: lime 0px 0px 5px;"></i>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>`;

    let chatData = {
        user: game.user._id,
        speaker: {
            alias: "Healed"
        },
        content,
    };
    ChatMessage.create(chatData, {});
}
