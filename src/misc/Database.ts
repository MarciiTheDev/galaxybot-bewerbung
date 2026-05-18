import { DataTypes, Sequelize } from "sequelize";
import {isDevEnv} from "../index.ts";

const database = new Sequelize(process.env.DATABASE_NAME!, process.env.DATABASE_USER!, process.env.DATABASE_PASSWORD!, {
    host: process.env.DATABASE_HOST!,
    port: Number.parseInt(process.env.DATABASE_PORT || "5432"),
    dialect: "postgres"
});

export const DatabasePanel = database.define("panel", {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    supportRoles: {
        type: DataTypes.JSON,
        allowNull: false
    },
    panelChannel: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    panelMessage: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    categories: {
        type: DataTypes.JSON,
        allowNull: false
    },
    guild: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    limit: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    nextNumber: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    }
});

export const DatabaseTicket = database.define("ticket", {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false
    },
    number: {
        type: DataTypes.INTEGER,
        unique: true,
        allowNull: false
    },
    panel: {
        type: DataTypes.UUID,
        allowNull: false
    },
    claimedBy: DataTypes.STRING,
    customer: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    channel: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    guild: {
        type: DataTypes.TEXT,
        allowNull: false
    }, // fallback in case of the panel being deleted => tickets still linked to guilds
    closed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }, // true = ticket channel deleted
});

try {
    await database.authenticate();
    console.log('Connection to Database has been established successfully.');
    await database.sync({ force: isDevEnv() });
    console.log('Database synced successfully.');
} catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
}