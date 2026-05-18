import type { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type { ExtendedClient } from "../bot";

export default interface Command {
    data: SlashCommandBuilder;
    run: (client: ExtendedClient, interaction: ChatInputCommandInteraction) => Promise<void>;
}