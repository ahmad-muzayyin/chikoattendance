import { sequelize } from './config/db';

const checkIndexes = async () => {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query("SHOW INDEX FROM users");
        console.log('Indexes on users table:');
        results.forEach((idx: any) => {
            console.log(`- ${idx.Key_name} (${idx.Column_name})`);
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkIndexes();
