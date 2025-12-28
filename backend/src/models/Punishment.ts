import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import { User } from './User';

interface PunishmentAttributes {
    id: number;
    userId: number;
    points: number;
    reason: string;
    date: Date;
}

interface PunishmentCreationAttributes extends Optional<PunishmentAttributes, 'id' | 'date'> { }

export class Punishment extends Model<PunishmentAttributes, PunishmentCreationAttributes> implements PunishmentAttributes {
    public id!: number;
    public userId!: number;
    public points!: number;
    public reason!: string;
    public date!: Date;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Punishment.init(
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
                key: 'id'
            }
        },
        points: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        reason: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        date: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'punishments',
    }
);

User.hasMany(Punishment, { foreignKey: 'userId' });
Punishment.belongsTo(User, { foreignKey: 'userId' });
