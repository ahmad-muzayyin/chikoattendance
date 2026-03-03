import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import { User } from './User';

export enum LeaveType {
    LEAVE = 'LEAVE', // Cuti
    PERMIT = 'PERMIT', // Izin
    SICK = 'SICK' // Sakit
}

export enum LeaveStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

interface LeaveRequestAttributes {
    id: number;
    userId: number;
    type: LeaveType;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    daysCount: number;
    reason: string;
    status: LeaveStatus;
    approvedBy?: number | null;
    rejectionReason?: string | null;
}

interface LeaveRequestCreationAttributes extends Optional<LeaveRequestAttributes, 'id' | 'status' | 'approvedBy' | 'rejectionReason'> { }

export class LeaveRequest extends Model<LeaveRequestAttributes, LeaveRequestCreationAttributes> implements LeaveRequestAttributes {
    public id!: number;
    public userId!: number;
    public type!: LeaveType;
    public startDate!: string;
    public endDate!: string;
    public daysCount!: number;
    public reason!: string;
    public status!: LeaveStatus;
    public approvedBy!: number | null;
    public rejectionReason!: string | null;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

LeaveRequest.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: User,
                key: 'id',
            },
        },
        type: {
            type: DataTypes.ENUM(...Object.values(LeaveType)),
            allowNull: false,
            defaultValue: LeaveType.LEAVE,
        },
        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        endDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        daysCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM(...Object.values(LeaveStatus)),
            allowNull: false,
            defaultValue: LeaveStatus.PENDING,
        },
        approvedBy: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
        },
        rejectionReason: {
            type: DataTypes.STRING,
            allowNull: true,
        }
    },
    {
        sequelize,
        tableName: 'leave_requests',
    }
);

User.hasMany(LeaveRequest, { foreignKey: 'userId' });
LeaveRequest.belongsTo(User, { foreignKey: 'userId' });
