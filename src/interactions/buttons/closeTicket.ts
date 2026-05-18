import {
    ButtonBuilder,
    ButtonStyle, type Interaction,
    MessageFlags,
    PermissionFlagsBits,
    type RepliableInteraction
} from "discord.js";
import type Button from "../../interfaces/Button";
import {DatabasePanel, DatabaseTicket} from "../../misc/Database.ts";
import Embeds from "../../misc/Embeds.ts";
import {Model} from "sequelize";

export default <Button> {
    data: new ButtonBuilder()
        .setLabel("Close Ticket")
        .setStyle(ButtonStyle.Danger)
        .setCustomId("closeTicket"),
    async run(client, interaction) {
        if(!interaction.guild) return;
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const ticket = await DatabaseTicket.findOne({ where: { channel: interaction.channelId } });
        if(!ticket) {
            await interaction.followUp({ embeds: [Embeds.ChannelNotLinkedToTicket] });
            return;
        }

        await HandleCloseTicketInteraction(interaction, ticket);
    },
}

export async function IsAllowedToManageTicket(interaction: Interaction, ticket: Model<any, any>) {
    if(!interaction.guild) return false;

    const panel = await DatabasePanel.findOne({ where: { id: ticket.get("panel") } });

    const member = await interaction.guild.members.fetch(interaction.user.id);
    if(!member) return false;

    if(member.permissions.has(PermissionFlagsBits.Administrator)) {
        return true;
    } else if(panel && member.roles.cache.hasAny(...panel.get("supportRoles") as string[])) {
        return true;
    }

    return false;
}

export async function HandleCloseTicketInteraction(interaction: RepliableInteraction, ticket: Model<any, any>) {
    if(!interaction.guild) return;

    let isAllowedToClose = ticket.get("customer") === interaction.user.id || await IsAllowedToManageTicket(interaction, ticket);
    if(!isAllowedToClose) {
        await interaction.followUp({ embeds: [Embeds.NoPermissionTo("close this ticket")] });
        return;
    }

    await ticket.update({ closed: true });
    try {
        await interaction.channel?.delete();
    } catch {
        await interaction.followUp({ embeds: [Embeds.FailedToCloseTicket] });
        return;
    }
}