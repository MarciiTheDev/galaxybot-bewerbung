import type {APIButtonComponentWithCustomId, Interaction} from "discord.js";
import type { ExtendedClient } from "../bot";
import {Buttons, Commands, Modals} from "../misc/Interactions";
import Embeds from "../misc/Embeds";

export default async function(client: ExtendedClient, interaction: Interaction) {
    if(interaction.isChatInputCommand()) {
        const command = Commands.find(cmd => cmd.data.name === interaction.commandName);
        try {
            if(!command) throw "Command not found";
            await command.run(client, interaction);
        } catch {
            await interaction.followUp({ embeds: [Embeds.FailedToExecuteCommand] }).catch(() => {
                interaction.reply({ embeds: [Embeds.FailedToExecuteCommand] }).catch(() => {})
            });
        }
    }

    if(interaction.isModalSubmit()) {
        const modal = Modals.find(modal => modal.data.data.custom_id === interaction.customId);
        try {
            if(!modal) throw "Command not found";
            await modal.run(client, interaction);
        } catch {
            await interaction.followUp({ embeds: [Embeds.FailedToExecuteCommand] }).catch(() => {
                interaction.reply({ embeds: [Embeds.FailedToExecuteCommand] }).catch(() => {})
            });
        }
    }

    if(interaction.isButton()) {
        const button = Buttons.find(btn => (btn.data.data as APIButtonComponentWithCustomId).custom_id === interaction.customId.split("#")[0]);
        try {
            if(!button) throw "Command not found";
            await button.run(client, interaction, interaction.customId.split("#").slice(1));
        } catch(err) {
            console.log(err)
            await interaction.followUp({ embeds: [Embeds.FailedToExecuteCommand] }).catch(() => {
                interaction.reply({ embeds: [Embeds.FailedToExecuteCommand] }).catch(() => {})
            });
        }
    }
}