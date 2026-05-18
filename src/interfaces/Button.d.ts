import type { ButtonBuilder, ButtonInteraction } from "discord.js";
import type { ExtendedClient } from "../bot";

export default interface Button {
    data: ButtonBuilder,
    run: (client: ExtendedClient, interaction: ButtonInteraction, args: string[]) => Promise<void>;
}