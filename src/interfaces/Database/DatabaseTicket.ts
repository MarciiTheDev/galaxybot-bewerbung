import {Model} from "sequelize";

export class DatabaseTicket extends Model {
    declare readonly id: string;
    declare readonly panel: string;
    declare readonly guild: string;
    declare readonly number: number;
    declare readonly channel: string;
    declare readonly customer: string;
    declare claimedBy: string | null;
    declare closed: boolean;
}