import {
    ActionRowBuilder, type APIButtonComponentWithCustomId, ButtonBuilder,
    ChannelSelectMenuBuilder,
    ChannelType,
    LabelBuilder,
    MessageFlags,
    ModalBuilder,
    PermissionFlagsBits,
    RoleSelectMenuBuilder,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";
import type Modal from "../../interfaces/Modal";
import Embeds, { EmbedStyle } from "../../misc/Embeds";
import { DatabasePanel } from "../../misc/Database";
import createTicket from "../buttons/createTicket.ts";

export default <Modal> {
    data: new ModalBuilder()
        .setTitle("Create new panel")
        .addLabelComponents([
            new LabelBuilder()
            .setLabel("Name")
            .setDescription("The name of the panel")
            .setTextInputComponent(new TextInputBuilder()
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(256)
                .setCustomId("name")
            ),
            new LabelBuilder()
            .setLabel("Description")
            .setDescription("The description of the panel")
            .setTextInputComponent(new TextInputBuilder()
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(4000)
                .setCustomId("description")
            ),
            new LabelBuilder()
            .setLabel("Channel")
            .setDescription("The channel in which the support panel is being displayed")
            .setChannelSelectMenuComponent(new ChannelSelectMenuBuilder()
                .setChannelTypes(ChannelType.GuildText)
                .setRequired(true)
                .setCustomId("channel")
            ),
            new LabelBuilder()
            .setLabel("Supporter role(s)")
            .setDescription("The role(s) that will be pinged once someone opens a ticket via this panel")
            .setRoleSelectMenuComponent(new RoleSelectMenuBuilder()
                .setRequired(false)
                .setCustomId("roles")
                .setMaxValues(5)
            ),
        ])
        .setCustomId("panelSetup"),
    run: async (client, interaction) => {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const name = interaction.fields.getTextInputValue("name");
        const description = interaction.fields.getTextInputValue("description");
        const channel = interaction.fields.getSelectedChannels("channel", true, [ChannelType.GuildText]).first()!;
        const roles = interaction.fields.getSelectedRoles("roles");

        const channelPerms = channel.permissionsFor(client.user, true)!;
        if(!channelPerms.has(PermissionFlagsBits.SendMessages) || !channelPerms.has(PermissionFlagsBits.ViewChannel)) {
            // checking for permissions here already so that when the category got created we can be 99% sure (user fault)
            // we have perms to send messages in the panel channel and not be stuck with just a category
            await interaction.followUp({ embeds: [Embeds.FailedToSendMessage(channel.id)] });
            return;
        }

        const permissions = [
            { id: channel.guildId, deny: PermissionFlagsBits.ViewChannel },
            { id: client.user.id, allow: PermissionFlagsBits.ViewChannel }
        ]

        roles?.values().toArray().forEach(role => {
            if(!role) return;
            permissions.push({
                id: role.id,
                allow: PermissionFlagsBits.ViewChannel
            })
        });

        let categoryId;
        try {
            categoryId = (await interaction.guild!.channels.create({
                name,
                type: ChannelType.GuildCategory,
                permissionOverwrites: permissions
            })).id;
        } catch {
            await interaction.followUp({ embeds: [Embeds.FailedToCreateChannel] });
            return;
        }

        const panelId = crypto.randomUUID();
        let panelMessageId;
        try {
            panelMessageId = (await channel.send({ embeds: [Embeds.DefaultEmbed(EmbedStyle.Normal, description, name)], components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(new ButtonBuilder(createTicket.data.data)
                        .setCustomId(`${(createTicket.data.data as APIButtonComponentWithCustomId).custom_id}#${panelId}`)
                    )
            ] })).id;
        } catch {
            await interaction.followUp({ embeds: [Embeds.FailedToSendMessage(channel.id)] });
            return;
        }

        await DatabasePanel.create({
            name,
            description,
            id: panelId,
            supportRoles: JSON.stringify(roles?.mapValues(role => role?.id) || []),
            panelChannel: channel.id,
            panelMessage: panelMessageId,
            categories: JSON.stringify([categoryId]),
            guild: interaction.guildId
        });

        await interaction.followUp({ embeds: [Embeds.SetupComplete(name, channel.id)] });
    }
}