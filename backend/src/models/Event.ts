import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';

interface EventAttributes {
    id: number;
    name: string;
    date: Date;
    description?: string;
    isSpecialEvent: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

interface EventCreationAttributes extends Optional<EventAttributes, 'id'> { }

export class Event extends Model<EventAttributes, EventCreationAttributes> implements EventAttributes {
    public id!: number;
    public name!: string;
    public date!: Date;
    public description?: string;
    public isSpecialEvent!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Event.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        date: {
            type: DataTypes.DATEONLY, // Just YYYY-MM-DD
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        isSpecialEvent: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'events',
    }
);
