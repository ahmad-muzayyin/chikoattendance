import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbName = process.env.DB_NAME || 'attendance_system';
const dbUser = process.env.DB_USER || 'root';
const dbPass = process.env.DB_PASS || '';
const dbHost = process.env.DB_HOST || 'localhost';

export const sequelize = new Sequelize(dbName, dbUser, dbPass, {
    host: dbHost,
    dialect: 'mysql',
    logging: false, // Set to console.log to see SQL queries
    timezone: '+07:00' // Adjust to local timezone
});

export const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');
        // Sync models (in production, use migrations instead of sync({ alter: true }))
        await sequelize.sync({ alter: true });
        console.log('Models synchronized.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};
