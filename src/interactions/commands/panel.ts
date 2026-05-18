import {
    ChannelType,
    type GuildTextBasedChannel,
    MessageFlags, PermissionFlagsBits, SlashCommandBuilder, SlashCommandSubcommandBuilder
} from "discord.js";
import type Command from "../../interfaces/Command";
import panelSetup, {SendPanelMessage} from "../modal/panelSetup";
import {DatabasePanel} from "../../misc/Database.ts";
import Embeds, {EmbedStyle} from "../../misc/Embeds.ts";

export default <Command> {
    data: new SlashCommandBuilder()
        .setName("panel")
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName("create")
            .setDescription("Setup a new support panel for users to create tickets on")
        )
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName("add-role")
            .setDescription("Adds passed role to the support roles list for the provided panel")
            .addStringOption(opt => opt
                .setName("panel-id")
                .setDescription("The Id of the panel")
                .setRequired(true)
            )
            .addRoleOption(opt => opt
                .setName("role")
                .setDescription("The role to add")
                .setRequired(true)
            )
        )
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName("remove-role")
            .setDescription("Removes passed role from the support roles list for the provided panel")
            .addStringOption(opt => opt
                .setName("panel-id")
                .setDescription("The Id of the panel")
                .setRequired(true)
            )
            .addRoleOption(opt => opt
                .setName("role")
                .setDescription("The role to remove")
                .setRequired(true)
            )
        )
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName("change-text")
            .setDescription("Changes the name and/or description of the provided panel")
            .addStringOption(opt => opt
                .setName("panel-id")
                .setDescription("The Id of the panel")
                .setRequired(true)
            )
            .addStringOption(opt => opt
                .setName("name")
                .setDescription("The updated name")
            )
            .addStringOption(opt => opt
                .setName("description")
                .setDescription("The updated description")
            )
        )
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName("change-channel")
            .setDescription("Changes the channel in which the provided panel is displayed")
            .addStringOption(opt => opt
                .setName("panel-id")
                .setDescription("The Id of the panel")
                .setRequired(true)
            )
            .addChannelOption(opt => opt
                .setName("channel")
                .addChannelTypes(ChannelType.GuildText)
                .setDescription("The updated channel")
                .setRequired(true)
            )
        )
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName("change-ticket-limit")
            .setDescription("Changes the ticket limit per user (default = 1) for the provided panel")
            .addStringOption(opt => opt
                .setName("panel-id")
                .setDescription("The Id of the panel")
                .setRequired(true)
            )
            .addIntegerOption(opt => opt
                .setName("limit")
                .setDescription("The number of tickets per user (default = 1)")
                .setRequired(true)
            )
        )
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName("list")
            .setDescription("Lists all panels configured for this guild")
        )
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName("delete")
            .setDescription("Deletes a panel (tickets which are still open can only be managed by administrators or closed by the user itself)")
            .addStringOption(opt => opt
                .setName("panel-id")
                .setDescription("The Id of the panel")
                .setRequired(true)
            )
        )
        .setDescription("Manage panels")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    run: async (client, interaction) => {
        if(!interaction.guild) return;
        const subCommand = interaction.options.getSubcommand(true);

        if(subCommand === "create") {
            await interaction.showModal(panelSetup.data);
            return;
        }

        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        if(subCommand === "list") {
            const panels = await DatabasePanel.findAll({ where: { guild: interaction.guildId! } });
            await interaction.followUp({ embeds: [
                Embeds.DefaultEmbed(EmbedStyle.Normal,
                    panels.length > 0 ?
                        panels.map(panel => {
                            return `**${panel.get("name")}** (\`${panel.get("id")}\`)\n` +
                                `> Ticket count: ${(panel.get("nextNumber") as number)-1}\n` +
                                `> Support roles: ${(panel.get("supportRoles") as string[]).map(id => {
                                    return `<@&${id}>`
                                })}`;
                        }).join("\n\n") : "There are `0` panels configured on this server."
                    , "Panel list")
                ]
            });
            return;
        }

        const panelId = interaction.options.getString("panel-id", true);
        const panel = await DatabasePanel.findOne({ where: { id: panelId } });
        if(!panel) {
            await interaction.followUp({ embeds: [Embeds.PanelNotFound(panelId)] });
            return;
        }

        switch(subCommand) {
            case "add-role":
            case "remove-role":
                const role = interaction.options.getRole("role", true);
                const supportRoles = panel.get("supportRoles") as string[];

                if(subCommand === "add-role") {
                    if(supportRoles.includes(role.id)) {
                        await interaction.followUp({ embeds: [Embeds.RoleAlreadyExists(role.id)] });
                        return;
                    }
                    supportRoles.push(role.id);
                    await interaction.followUp({ embeds: [Embeds.RoleAdded(role.id)] });
                }

                if(subCommand === "remove-role") {
                    if(!supportRoles.includes(role.id)) {
                        await interaction.followUp({ embeds: [Embeds.RoleDoesntExist(role.id)] });
                        return;
                    }
                    supportRoles.splice(supportRoles.indexOf(role.id), 1);
                    await interaction.followUp({ embeds: [Embeds.RoleRemoved(role.id)] });
                }

                await panel.update({ supportRoles });
                break;
            case "change-ticket-limit":
                const limit = interaction.options.getInteger("limit", true);

                if(limit < 1 || limit > 10) {
                    await interaction.followUp({ embeds: [Embeds.InvalidLimit] });
                    return;
                }

                await panel.update({ limit });
                await interaction.followUp({ embeds: [Embeds.LimitUpdated(limit)] });
                break;
            case "delete":
            case "change-text":
            case "change-channel":
                const channelId = panel.get("panelChannel") as string;
                const messageId = panel.get("panelMessage") as string;

                const panelMessage =
                    await ((await interaction.guild.channels.fetch(channelId)) as GuildTextBasedChannel | null)?.messages.fetch(messageId).catch(() => { });

                if(subCommand === "delete") {
                    panelMessage?.delete().catch(() => {});
                    await panel.destroy();
                    await interaction.followUp({ embeds: [Embeds.PanelDeleted] });
                    return;
                }

                const name = panel.get("name") as string;
                const description = panel.get("description") as string;

                if(subCommand === "change-channel") {
                    const newChannel = interaction.options.getChannel("channel", true) as GuildTextBasedChannel;

                    let newPanelMessageId = await SendPanelMessage(newChannel, name, description, panelId);

                    if(!newPanelMessageId) {
                        await interaction.followUp({ embeds: [Embeds.FailedToSendMessage(newChannel.id)] });
                        return;
                    }

                    panelMessage?.delete().catch(() => {});
                    await panel.update({ panelChannel: newChannel.id, panelMessage: newPanelMessageId });

                    await interaction.followUp({ embeds: [Embeds.ChannelUpdated(newChannel.id)] });
                    return;
                }

                if(!panelMessage) {
                    await interaction.followUp({ embeds: [Embeds.MessageNotFound] });
                    return;
                }

                if(subCommand === "change-text") {
                    const newName = interaction.options.getString("name");
                    const newDescription = interaction.options.getString("description");

                    if(!newName && !newDescription) {
                        await interaction.followUp({ embeds: [Embeds.InvalidMessageUpdate] });
                        return;
                    }

                    if(newName === name && newDescription === description) {
                        await interaction.followUp({ embeds: [Embeds.InvalidMessageUpdate] });
                        return;
                    }

                    await SendPanelMessage(panelMessage.channel, newName || name, newDescription || description, panelId, panelMessage);
                    await interaction.followUp({ embeds: [Embeds.MessageUpdated] });
                    return;
                }

                break;
        }
    }
}