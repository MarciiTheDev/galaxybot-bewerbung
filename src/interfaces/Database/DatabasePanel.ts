import {Model} from "sequelize";

export default class DatabasePanel extends Model {
    declare readonly id: string;
    declare readonly guild: string;
    declare name: string;
    declare description: string;
    declare supportRoles: string[];
    declare panelChannel: string;
    declare panelMessage: string;
    declare categories: string[];
    declare limit: number;
    declare nextNumber: number;
}