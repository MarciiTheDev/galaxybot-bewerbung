import type { ExtendedClient } from "../bot";
import { Commands } from "../misc/Interactions";

export default async function(client: ExtendedClient) {
    await client.application.commands.set(Commands.map(cmd => cmd.data));
    console.log("Bot ready!");
}