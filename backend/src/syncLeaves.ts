import { LeaveRequest } from './models/LeaveRequest';

const syncNow = async () => {
    try {
        await LeaveRequest.sync({ alter: true });
        console.log('LeaveRequest table created/updated.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

syncNow();
