import type { Guild } from "discord.js";
import Embeds from "../misc/Embeds";

export default async function(guild: Guild) {
    const user = await guild.fetchOwner();
    await user.send({ embeds: [Embeds.ThanksForInviting] });
}