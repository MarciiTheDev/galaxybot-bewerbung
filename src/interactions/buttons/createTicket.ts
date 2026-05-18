import type Button from "../../interfaces/Button";
import {
    ButtonBuilder,
    ButtonStyle,
    type CategoryChannel,
    ChannelType, type GuildTextBasedChannel,
    MessageFlags,
    PermissionFlagsBits
} from "discord.js";
import {DatabasePanel, DatabaseTicket} from "../../misc/Database.ts";
import Embeds, {EmbedStyle} from "../../misc/Embeds.ts";
import {findAsync} from "../../index.ts";

export default <Button> {
    data: new ButtonBuilder()
        .setLabel("Create Ticket")
        .setEmoji("📩")
        .setStyle(ButtonStyle.Primary)
        .setCustomId("createTicket"),
    run: async (client, interaction, args) => {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const panelId = args[0];
        if(!panelId) return;

        const panel = await DatabasePanel.findOne({ where: { id: panelId } });
        if(!panel) return;

        const guildId = panel.get("guild") as string;
        if(interaction.guildId !== guildId) return;

        const openTicket = await DatabaseTicket.findOne({ where: {
                customer: interaction.user.id,
                panel: panelId,
                closed: false
            } });

        if(openTicket) {
            const channelId = openTicket.get("channel") as string;
            const channel = await interaction.guild!.channels.fetch(channelId); // guild can't be null because of the check with the guildId and a non-null value above

            if(channel) {
                await interaction.followUp({ embeds: [Embeds.TicketAlreadyOpen(channelId)] });
                return;
            }

            await openTicket.update("closed", true); // there can be a race-condition here in which there are multiple open tickets if the user clicks the button fast enough cba to fix it in the scope of this project tho
        }

        console.log("HI")

        // IDK ERROR
        let categoryId = await findAsync(JSON.parse(panel.get("categories") as string) as string[], async (id) => {
            const category = await interaction.guild!.channels.fetch(id) as CategoryChannel;
            if(!category) return false;

            return Object.keys(category.children).length < 50;
        });
        // TILL HERE

        const supportRoles = JSON.parse(panel.get("supportRoles") as string) as string[];

        if(!categoryId) {

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
                categoryId = (await interaction.guild!.channels.create({
                    type: ChannelType.GuildCategory,
                    name: `${panel.get("name")} - Overflow`,
                    permissionOverwrites: permissions
                })).id;
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

                const ticketNumber = panel.get("nextNumber") as number;

                ticketChannel = await interaction.guild!.channels.create({
                    name: `ticket-${ticketNumber}`,
                    type: ChannelType.GuildText,
                    parent: categoryId,
                    permissionOverwrites: [
                        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
                    ]
                });

                await panel.update("nextNumber", ticketNumber+1, { transaction: t });

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
                content: supportRoles.map(role => {
                    return `<&@${role}>`
                }).join() + `<@${interaction.user.id}>`,
                allowedMentions: {
                    roles: supportRoles,
                    users: [interaction.user.id]
                },
                embeds: [Embeds.DefaultEmbed(
                    EmbedStyle.Normal,
                    "Members of the support team will soon be here to help you out with your inquiry. In the meantime, please specify what you need help with. The more precise you are, the better our staff can help you.",
                    "Thanks for reaching out"
                )]
            });
        } catch {
            await interaction.followUp({ embeds: [Embeds.FailedToSendMessage(ticketChannel!.id)] });
            return;
        }

        await interaction.followUp({ embeds: [Embeds.TicketCreated(ticketChannel!.id)] })
        return;
    }
}