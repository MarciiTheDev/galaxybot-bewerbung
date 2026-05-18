import type Command from "../../interfaces/Command";
import {
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
    SlashCommandSubcommandBuilder,
    TextChannel
} from "discord.js";
import {DatabaseTicket} from "../../misc/Database.ts";
import Embeds from "../../misc/Embeds.ts";
import {HandleCloseTicketInteraction, IsAllowedToManageTicket} from "../buttons/closeTicket.ts";
import {HandleTicketClaimInteraction} from "../buttons/claimTicket.ts";

export default <Command> {
    data: new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Manage tickets")
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName("close")
            .setDescription("Closes the ticket.")
        )
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName("claim")
            .setDescription("Claims the ticket.")
        )
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName("unclaim")
            .setDescription("Unclaims the ticket.")
        ),
    async run(client, interaction) {
        if(!interaction.guild) return;
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const ticket = await DatabaseTicket.findOne({ where: { channel: interaction.channelId } });
        if(!ticket) {
            await interaction.followUp({ embeds: [Embeds.ChannelNotLinkedToTicket] });
            return;
        }

        const subCommand = interaction.options.getSubcommand(true);
        if(subCommand === "close") {
            await HandleCloseTicketInteraction(interaction, ticket);
            return;
        }

        if(!(await IsAllowedToManageTicket(interaction, ticket))) {
            await interaction.followUp({ embeds: [Embeds.NoPermissionTo("manage this ticket")] });
            return;
        }

        switch (interaction.options.getSubcommand(true)) {
            case "claim":
                await HandleTicketClaimInteraction(interaction, ticket);
                break;
            case "unclaim":
                const claimedBy = ticket.get("claimedBy") as string | null;
                if(!claimedBy) {
                    await interaction.followUp({ embeds: [Embeds.TicketNotClaimed] });
                    return;
                }

                // Member should be cached as the function "IsAllowedToManageTicket", called previously fetches the member
                if(claimedBy !== interaction.user.id && !interaction.guild.members.cache.get(interaction.user.id)?.permissions.has(PermissionFlagsBits.Administrator)) {
                    await interaction.followUp({ embeds: [Embeds.NoPermissionTo("unclaim tickets you didn't claim yourself")] });
                    return;
                }

                await ticket.update({ claimedBy: null });
                await interaction.followUp({ embeds: [Embeds.TicketUnclaimed] });

                try {
                    await (interaction.channel! as TextChannel).send({
                        embeds: [Embeds.TicketUnclaimedMessage]
                    });
                } catch {}
                break;
        }
    }
}