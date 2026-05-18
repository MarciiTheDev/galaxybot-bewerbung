import type { AnySelectMenuInteraction, APIBaseSelectMenuComponent } from "discord.js";

export default interface Selection {
    data: APIBaseSelectMenuComponent,
    run: (client: ExtendedClient, interaction: AnySelectMenuInteraction) => Promise<void>;
}