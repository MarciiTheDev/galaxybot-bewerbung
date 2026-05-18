import type { ModalBuilder, ModalSubmitInteraction } from "discord.js";

export default interface Modal {
    data: ModalBuilder
    run: (client: ExtendedClient, interaction: ModalSubmitInteraction) => Promise<void>;
}