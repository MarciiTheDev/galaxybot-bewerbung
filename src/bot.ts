import { Client, Events, type ClientOptions } from "discord.js";
import { Cluster } from "galactic.ts";
import onReady from "./listeners/onReady";
import type BotGlobals from "./interfaces/BotGlobals";
import onGuildCreate from "./listeners/onGuildCreate";
import onInteractionCreate from "./listeners/onInteractionCreate";

export class ExtendedClient extends Client<true> {
    cluster: Cluster<ExtendedClient>;
    globals: BotGlobals;
    
    constructor(options: ClientOptions, cluster: Cluster<ExtendedClient>, globals: BotGlobals) {
        super(options);
        this.cluster = cluster;
        this.globals = globals;
    }
}

const cluster = Cluster.initial<ExtendedClient>();

const client = new ExtendedClient(
    {
        shards: cluster.shardList,
        shardCount: cluster.totalShards,
        intents: cluster.intents,
    },
    cluster,
    {

    }
);

cluster.onSelfDestruct = async () => {
    await client.destroy();
};

client.on(Events.ClientReady, () => onReady(client));
client.on(Events.InteractionCreate, (interaction) => onInteractionCreate(client, interaction));
client.on(Events.GuildCreate, onGuildCreate)

await client.login(cluster.token);