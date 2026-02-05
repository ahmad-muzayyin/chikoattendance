import { User } from './src/models/User';
import { sequelize } from './src/config/db';
import { Op } from 'sequelize';

async function checkTokens() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        const users = await User.findAll({
            where: {
                pushToken: { [Op.not]: null }
            },
            attributes: ['id', 'name', 'role', 'pushToken', 'branchId']
        });

        console.log(`\nFound ${users.length} users with Push Tokens:`);
        users.forEach(u => {
            const tokenPreview = u.pushToken && u.pushToken.length > 20
                ? u.pushToken.substring(0, 20) + '...'
                : u.pushToken;
            console.log(`[${u.id}] ${u.name} (${u.role}) - Branch: ${u.branchId || 'None'} - Token: ${tokenPreview}`);
        });

    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        await sequelize.close();
    }
}

checkTokens();
