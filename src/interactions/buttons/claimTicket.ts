import type Button from "../../interfaces/Button";
import {ButtonBuilder, ButtonStyle, MessageFlags, type RepliableInteraction, TextChannel} from "discord.js";
import {IsAllowedToManageTicket} from "./closeTicket.ts";
import Embeds from "../../misc/Embeds.ts";
import {DatabaseTicket} from "../../misc/Database.ts";
import type {Model} from "sequelize";

export default <Button> {
    data: new ButtonBuilder()
        .setLabel("Claim Ticket")
        .setStyle(ButtonStyle.Primary)
        .setCustomId("claimTicket"),
    async run(client, interaction) {
        if(!interaction.guild) return;

        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const ticket = await DatabaseTicket.findOne({ where: { channel: interaction.channelId } });
        if(!ticket) {
            await interaction.followUp({ embeds: [Embeds.ChannelNotLinkedToTicket] });
            return;
        }

        if(!(await IsAllowedToManageTicket(interaction, ticket))) {
            await interaction.followUp({ embeds: [Embeds.NoPermissionTo("manage this ticket")] });
            return;
        }

        await HandleTicketClaimInteraction(interaction, ticket);
    }
}

export async function HandleTicketClaimInteraction(interaction: RepliableInteraction, ticket: Model<any, any>) {
    if(!interaction.guild) return;

    const claimedBy = ticket.get("claimedBy") as string | null;
    if(claimedBy) {
        await interaction.followUp({ embeds: [Embeds.TicketAlreadyClaimed] });
        return;
    }

    await ticket.update({ claimedBy: interaction.user.id });
    await interaction.followUp({ embeds: [Embeds.TicketClaimed] });

    try {
        await (interaction.channel! as TextChannel).send({
            embeds: [Embeds.TicketClaimedMessage(interaction.user.id)]
        });
    } catch {}
}