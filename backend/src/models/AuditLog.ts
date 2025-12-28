import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import { User } from './User';

interface AuditLogAttributes {
    id: number;
    action: string;
    performedBy: number;
    targetId?: string; // Flexible ID (could be string or number)
    timestamp: Date;
    details?: string;
}

interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'targetId' | 'details' | 'timestamp'> { }

export class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
    public id!: number;
    public action!: string;
    public performedBy!: number;
    public targetId!: string;
    public timestamp!: Date;
    public details!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

AuditLog.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        action: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        performedBy: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: User,
                key: 'id'
            }
        },
        targetId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        timestamp: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        details: {
            type: DataTypes.STRING,
            allowNull: true
        }
    },
    {
        sequelize,
        tableName: 'audit_logs',
    }
);

User.hasMany(AuditLog, { foreignKey: 'performedBy' });
AuditLog.belongsTo(User, { foreignKey: 'performedBy' });
