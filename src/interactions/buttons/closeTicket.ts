import { ButtonBuilder, ButtonStyle } from "discord.js";
import type Button from "../../interfaces/Button";

export default <Button> {
    data: new ButtonBuilder()
        .setLabel("Close Ticket")
        .setStyle(ButtonStyle.Danger)
        .setCustomId("closeTicket"),
    async run(client, interaction, args) {
        
    },
}