import { DataTypes, Sequelize } from "sequelize";

const database = new Sequelize(process.env.DATABASE_NAME!, process.env.DATABASE_USER!, process.env.DATABASE_PASSWORD!, {
    host: process.env.DATABASE_HOST!,
    port: Number.parseInt(process.env.DATABASE_PORT || "5432"),
    dialect: "postgres"
});

export const DatabasePanel = database.define("panel", {
    id: {
        type: DataTypes.UUID,
        primaryKey: true
    },
    name: DataTypes.TEXT,
    description: DataTypes.TEXT,
    supportRoles: DataTypes.JSON,
    panelChannel: DataTypes.TEXT,
    panelMessage: DataTypes.TEXT,
    categories: DataTypes.JSON,
    guild: DataTypes.TEXT,
    nextNumber: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    }
});

export const DatabaseTicket = database.define("ticket", {
    id: {
        type: DataTypes.UUID,
        primaryKey: true
    },
    number: {
        type: DataTypes.INTEGER,
        unique: true
    },
    panel: DataTypes.UUID,
    customer: DataTypes.TEXT,
    channel: DataTypes.TEXT,
    guild: DataTypes.TEXT, // fallback in case of the panel being deleted => tickets still linked to guilds
    closed: DataTypes.BOOLEAN, // true = ticket channel deleted
});

try {
    await database.authenticate();
    console.log('Connection to Database has been established successfully.');
    await database.sync({ force: true });
    console.log('Database synced successfully.');
} catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
}