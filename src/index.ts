import { StandaloneInstance } from "galactic.ts";

const instance = new StandaloneInstance(
    `${__dirname}/bot.ts`,
    isDevEnv() ? 1 : 2,
    isDevEnv() ? 1 : 2,
    process.env.DISCORD_TOKEN!,
    [
        "Guilds", "GuildMessages"
    ]
);

export function isDevEnv() {
    return process.env.NODE_ENV !== "production"
}

export async function findAsync<T extends any[]>(arr: T, asyncCallback: (element: T[0]) => Promise<boolean>): Promise<T[0] | null> {
    const promises = arr.map(asyncCallback);
    const results = await Promise.all(promises);
    const index = results.findIndex(result => result);
    if(index === -1) return null;

    return arr[index];
}

instance.start();

process.once("SIGINT", async () => {
    console.log("Shutdown cluster...");
    await instance.shutdown();
    console.log("Cluster shutdown successfull!");
})