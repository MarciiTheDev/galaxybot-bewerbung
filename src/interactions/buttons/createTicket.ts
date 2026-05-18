import type Button from "../../interfaces/Button";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    type CategoryChannel,
    ChannelType, type GuildTextBasedChannel,
    MessageFlags,
    PermissionFlagsBits
} from "discord.js";
import Embeds, {EmbedStyle} from "../../misc/Embeds.ts";
import closeTicket from "./closeTicket.ts";
import claimTicket from "./claimTicket.ts";
import DatabasePanel from "../../interfaces/Database/DatabasePanel.ts";
import {DatabaseTicket} from "../../interfaces/Database/DatabaseTicket.ts";

export default <Button> {
    data: new ButtonBuilder()
        .setLabel("Create Ticket")
        .setEmoji("📩")
        .setStyle(ButtonStyle.Primary)
        .setCustomId("createTicket"),
    run: async (client, interaction, args) => {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const panelId = args[0];
        if(!panelId) {
            await interaction.followUp({ embeds: [Embeds.PanelDoesntExist] });
            return;
        }

        const panel = await DatabasePanel.findOne({ where: { id: panelId } });
        if(!panel) {
            await interaction.followUp({ embeds: [Embeds.PanelDoesntExist] });
            return;
        }

        const guildId = panel.get("guild");
        if(interaction.guildId !== guildId) return; // this shouldn't happen

        const openTickets = await DatabaseTicket.findAll({ where: {
                customer: interaction.user.id,
                panel: panelId,
                closed: false
            } });

        const ticketLimit = panel.get("limit");
        if(openTickets.length >= ticketLimit) {
            let userHitsLimit = true;
            for(const ticket of openTickets) {
                const channelId = ticket.get("channel");
                const channel = await interaction.guild!.channels.fetch(channelId); // guild can't be null because of the check with the guildId and a non-null value above

                if(channel) continue;

                userHitsLimit = false;
                await ticket.update("closed", true); // there can be a race-condition here in which there are multiple open tickets if the user clicks the button fast enough cba to fix it in the scope of this project tho
                break;
            }

            if(userHitsLimit) {
                await interaction.followUp({ embeds: [
                    Embeds.TicketAlreadyOpen(openTickets.map(ticket => (ticket.get("channel") as string)), ticketLimit)
                ] });
                return;
            }
        }

        let category: CategoryChannel | null = null;
        for(const id of panel.get("categories")) {
            const possibleCategory = await interaction.guild!.channels.fetch(id) as CategoryChannel;
            if(!possibleCategory) continue;
            if(Object.keys(possibleCategory.children).length >= 50) continue;
            category = possibleCategory;
            break;
        }

        const supportRoles = panel.get("supportRoles");

        if(!category) {

            const permissions = [
                { id: interaction.guildId!, deny: PermissionFlagsBits.ViewChannel },
                { id: client.user.id, allow: PermissionFlagsBits.ViewChannel }
            ];

            supportRoles.forEach(role => {
                if(!role) return;
                permissions.push({
                    id: role,
                    allow: PermissionFlagsBits.ViewChannel
                })
            });

            try {
                category = (await interaction.guild!.channels.create({
                    type: ChannelType.GuildCategory,
                    name: `${panel.get("name")} - Overflow`,
                    permissionOverwrites: permissions
                }));
            } catch {
                await interaction.followUp({ embeds: [Embeds.FailedToCreateChannel] });
                return;
            }
        }

        let ticketChannel: GuildTextBasedChannel;
        let ticketNumber: number;
        try {
            ticketNumber = await DatabasePanel.sequelize!.transaction(async (t) => {
                const panel = await DatabasePanel.findOne({ where: { id: panelId }, lock: t.LOCK.UPDATE, transaction: t });
                if(!panel) throw "Panel not found";

                const ticketNumber = panel.get("nextNumber");

                ticketChannel = await interaction.guild!.channels.create({
                    name: `ticket-${ticketNumber}`,
                    type: ChannelType.GuildText,
                    parent: category.id,
                    permissionOverwrites: [
                        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                        ...category.permissionOverwrites.cache.map(perm => {
                            return {
                                id: perm.id,
                                allow: perm.allow,
                                deny: perm.deny
                            }
                        })
                    ]
                });

                await panel.update({ nextNumber: ticketNumber+1 }, { transaction: t });

                return ticketNumber;
            });
        } catch {
            await interaction.followUp({ embeds: [Embeds.FailedToCreateChannel] });
            return;
        }

        const ticketId = crypto.randomUUID();
        await DatabaseTicket.create({
            id: ticketId,
            number: ticketNumber,
            panel: panelId,
            customer: interaction.user.id,
            // @ts-ignore - It is assigned https://sequelize.org/docs/v6/other-topics/transactions/
            channel: ticketChannel.id,
            guild: guildId,
            closed: false
        });

        try {
            await ticketChannel!.send({
                content: (supportRoles.map(role => {
                    return `<@&${role}>`
                }).join() + `<@${interaction.user.id}>`),
                allowedMentions: {
                    roles: supportRoles,
                    users: [interaction.user.id]
                },
                embeds: [Embeds.DefaultEmbed(
                    EmbedStyle.Normal,
                    "Members of the support team will soon be here to help you out with your inquiry. In the meantime, please specify what you need help with. The more precise you are, the better our staff can help you.",
                    "Thanks for reaching out"
                )],
                components: [new ActionRowBuilder<ButtonBuilder>().addComponents(claimTicket.data, closeTicket.data)]
            });
        } catch {
            await interaction.followUp({ embeds: [Embeds.FailedToSendMessage(ticketChannel!.id)] });
            return;
        }

        await interaction.followUp({ embeds: [Embeds.TicketCreated(ticketChannel!.id)] })
        return;
    }
}