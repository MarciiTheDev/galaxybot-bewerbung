import { PermissionFlagsBits, SlashCommandBuilder, SlashCommandSubcommandBuilder } from "discord.js";
import type Command from "../../interfaces/Command";
import panelSetup from "../modal/panelSetup";

export default <Command> {
    data: new SlashCommandBuilder()
        .setName("panel")
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName("create")
            .setDescription("Setup a new support panel for users to create tickets on")
        )
        .setDescription("Manage panels")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    run: async (client, interaction) => {
        await interaction.showModal(panelSetup.data);
    }
}