import { EmbedBuilder } from "@discordjs/builders"

export enum EmbedStyle {
    Normal,
    Error,
    Info
}

function DefaultEmbed(style: EmbedStyle, description: string, title?: string) {

    let color;

    switch(style) {
        case EmbedStyle.Normal:
            color = 0x393A41;
            break;
        case EmbedStyle.Error:
            color = 0x000000;
            break;
        case EmbedStyle.Info:
            color = 0x000000;
            break;
    }

    return new EmbedBuilder()
        .setTitle(title || null)
        .setDescription(description)
        .setColor(color)
};

export default {
    ThanksForInviting: DefaultEmbed(EmbedStyle.Normal, "Test", "test"),
    FailedToExecuteCommand: DefaultEmbed(EmbedStyle.Error, "Failed to execute that command"),
    FailedToCreateChannel: DefaultEmbed(EmbedStyle.Error, `Please make sure I have permission to create channels in this server.`, "Failed to create channel"),
    DefaultEmbed,
    SetupComplete: (panel: string, channelId: string) =>
        DefaultEmbed(EmbedStyle.Normal, `Panel \`${panel}\` successfully created. Users can now create tickets via the new panel sent into <#${channelId}>.`, "Setup complete"),
    FailedToSendMessage: (channelId: string) =>
        DefaultEmbed(EmbedStyle.Error, `Please make sure I have permission to send messages in <#${channelId}>.`, "Failed to send message"),
    TicketAlreadyOpen: (channelId: string) =>
        DefaultEmbed(EmbedStyle.Error, `You already have a ticket open in this category. Users can only have \`1\` ticket per panel. Please close your ticket in <#${channelId}> before opening a new one.`, "Ticket limit reached"),
    TicketCreated: (channelId: string) =>
        DefaultEmbed(EmbedStyle.Normal, `Click here to get to your ticket: <#${channelId}>`, "Ticket created"),
}