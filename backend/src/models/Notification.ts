import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import { User } from './User';

interface NotificationAttributes {
    id: number;
    userId: number; // Recipient
    title: string;
    message: string;
    type: string; // 'INFO', 'WARNING', 'SUCCESS', 'ERROR'
    isRead: boolean;
    data?: string; // JSON string for extra data
}

interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'isRead' | 'data'> { }

export class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
    public id!: number;
    public userId!: number;
    public title!: string;
    public message!: string;
    public type!: string;
    public isRead!: boolean;
    public data!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Notification.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING,
            defaultValue: 'INFO',
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        data: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'notifications',
    }
);

// Association
User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });
