import type Command from "../interfaces/Command";
import type Button from "../interfaces/Button";

import setup from "../interactions/commands/create-panel";
import type Modal from "../interfaces/Modal";
import panelSetup from "../interactions/modal/panelSetup";
import createTicket from "../interactions/buttons/createTicket.ts";

export const Commands: Command[] = [
    setup
];

export const Buttons: Button[] = [
    createTicket
];

export const Modals: Modal[] = [
    panelSetup
];