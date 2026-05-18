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
            color = 0xFF6961;
            break;
        case EmbedStyle.Info:
            color = 0xB3EBF2;
            break;
    }

    return new EmbedBuilder()
        .setTitle(title || null)
        .setDescription(description)
        .setColor(color)
}

export default {
    ThanksForInviting: DefaultEmbed(EmbedStyle.Normal, "Test", "test"),
    FailedToExecuteCommand: DefaultEmbed(EmbedStyle.Error, "Failed to execute that command"),
    FailedToCreateChannel: DefaultEmbed(EmbedStyle.Error, `Please make sure I have permission to create channels in this server.`, "Failed to create channel"),
    DefaultEmbed,
    SetupComplete: (panel: string, channelId: string) =>
        DefaultEmbed(EmbedStyle.Normal, `Panel \`${panel}\` successfully created. Users can now create tickets via the new panel sent into <#${channelId}>.`, "Setup complete"),
    ChannelUpdated: (channelId: string) =>
        DefaultEmbed(EmbedStyle.Normal, `Users can now create tickets via the new panel sent into <#${channelId}>.`, "Channel changed"),
    FailedToSendMessage: (channelId: string) =>
        DefaultEmbed(EmbedStyle.Error, `Please make sure I have permission to send messages in <#${channelId}>.`, "Failed to send message"),
    FailedToCloseTicket: DefaultEmbed(EmbedStyle.Error, `Please make sure I have permission to delete this channel.`, "Failed to close the ticket"),
    TicketAlreadyOpen: (channelIds: string[], limit: number) =>
        DefaultEmbed(EmbedStyle.Error, `You already have a ticket open in this category. Users can only have \`${limit}\` ticket(s) for this panel. Please close your ticket(s) in ${channelIds.map(id => `<#${id}>`)} before opening a new one.`, "Ticket limit reached"),
    TicketCreated: (channelId: string) =>
        DefaultEmbed(EmbedStyle.Normal, `Click here to get to your ticket: <#${channelId}>`, "Ticket created"),
    NoPermissionTo: (thing: string) =>
        DefaultEmbed(EmbedStyle.Error, `You don't have permission to ${thing}.`, "Unauthorized"),
    RoleAlreadyExists: (roleId: string) =>
        DefaultEmbed(EmbedStyle.Error, `The role (<@&${roleId}>) you are trying to add is already on the support roles list.`, "Already added"),
    RoleDoesntExist: (roleId: string) =>
        DefaultEmbed(EmbedStyle.Error, `The role (<@&${roleId}>) you are trying to remove is not on the support roles list.`, "Doesn't exist"),
    RoleAdded: (roleId: string) =>
        DefaultEmbed(EmbedStyle.Normal, `<@&${roleId}> has been added to the support roles list successfully.`, "Role added"),
    RoleRemoved: (roleId: string) =>
        DefaultEmbed(EmbedStyle.Normal, `<@&${roleId}> has been removed from the support roles list successfully.`, "Role removed"),
    LimitUpdated: (limit: number) =>
        DefaultEmbed(EmbedStyle.Normal, `The ticket limit per user has been set to \`${limit}\` successfully.`, "Limit updated"),
    MessageNotFound: DefaultEmbed(EmbedStyle.Error, `The panel you are trying to update couldn't be found. Use \`/panel change-channel\` to re-send the panel.`, "Panel not found"),
    InvalidMessageUpdate: DefaultEmbed(EmbedStyle.Error, `You need to at least update the \`name\` or \`description\`. Either you didn't provide at least one of those two arguments or the original panel does not differentiate itself from the update.`, "Invalid usage"),
    InvalidLimit: DefaultEmbed(EmbedStyle.Error, `The ticket limit per user must be between (including) \`1\` and \`10\``, "Invalid limit"),
    MessageUpdated: DefaultEmbed(EmbedStyle.Normal, `The panel has been updated successfully.`, "Panel updated"),
    TicketNotFound: DefaultEmbed(EmbedStyle.Error, `The ticket you are trying to interact with couldn't be found.`, "Ticket not found"),
    ChannelNotLinkedToTicket: DefaultEmbed(EmbedStyle.Error, `This channel is not linked to any ticket.`, "No ticket channel"),
    TicketAlreadyClaimed: DefaultEmbed(EmbedStyle.Error, `Someone already claimed the ticket.`, "Ticket already claimed"),
    TicketClaimed: DefaultEmbed(EmbedStyle.Normal, `Ticket claimed successfully.`, "Ticket claimed"),
    TicketUnclaimed: DefaultEmbed(EmbedStyle.Normal, `Ticket unclaimed successfully.`, "Ticket unclaimed"),
    TicketUnclaimedMessage: DefaultEmbed(EmbedStyle.Error, `The ticket has been unclaimed. A different support agent will be with you soon.`, "Ticket unclaimed"),
    TicketNotClaimed: DefaultEmbed(EmbedStyle.Error, "The ticket you are trying to unclaim is not claimed", "Ticket unclaimed"),
    PanelDoesntExist: DefaultEmbed(EmbedStyle.Error, "The panel you are trying to create a ticket in, doesn't exist", "Panel not found"),
    PanelDeleted: DefaultEmbed(EmbedStyle.Info, "The panel has been deleted successfully", "Panel deleted"),
    TicketClaimedMessage: (agentId: string) =>
        DefaultEmbed(EmbedStyle.Info, `Ticket has been claimed by <@${agentId}>. They will respond to your case shortly.`, "Ticket claimed"),
    PanelNotFound: (panelId: string) =>
        DefaultEmbed(EmbedStyle.Error, `Panel with the Id \`${panelId}\` couldn't be found. Please make sure you've passed a valid Id and the panel exists.`, "Panel not found"),
}