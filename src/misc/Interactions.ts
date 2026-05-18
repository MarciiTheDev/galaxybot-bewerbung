import type Command from "../interfaces/Command";
import type Button from "../interfaces/Button";

import setup from "../interactions/commands/panel.ts";
import type Modal from "../interfaces/Modal";
import panelSetup from "../interactions/modal/panelSetup";
import createTicket from "../interactions/buttons/createTicket.ts";
import closeTicket from "../interactions/buttons/closeTicket.ts";
import ticket from "../interactions/commands/ticket.ts";
import claimTicket from "../interactions/buttons/claimTicket.ts";

export const Commands: Command[] = [
    setup,
    ticket
];

export const Buttons: Button[] = [
    createTicket,
    closeTicket,
    claimTicket
];

export const Modals: Modal[] = [
    panelSetup
];