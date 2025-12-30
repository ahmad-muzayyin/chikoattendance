import { sequelize } from './config/db';

const fixIndexes = async () => {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query("SHOW INDEX FROM users");

        for (const idx of results as any[]) {
            if (idx.Key_name.startsWith('email_') || idx.Key_name === 'email') {
                if (idx.Key_name === 'email') continue; // Keep the original one if possible, or drop duplicates

                console.log(`Dropping index ${idx.Key_name}...`);
                try {
                    await sequelize.query(`DROP INDEX ${idx.Key_name} ON users`);
                } catch (e: any) {
                    console.error(`Failed to drop ${idx.Key_name}:`, e.message);
                }
            }
        }

        console.log('Finished cleaning indexes.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

fixIndexes();
