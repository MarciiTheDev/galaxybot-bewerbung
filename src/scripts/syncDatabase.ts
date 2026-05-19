import { database as sequelize } from "../misc/Database";

const database = sequelize;

console.log("Syncing Database...");
await database.sync({ force: true });
console.log("Database synced successfully.");
await database.close();