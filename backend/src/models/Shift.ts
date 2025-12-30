// d:\AHMAD MUZAYYIN\ChikoAttendance\backend\src\models\Shift.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';

interface ShiftAttributes {
    id: number;
    name: string;      // e.g. "Shift Pagi", "Shift Malam"
    startHour: string; // "08:00"
    endHour: string;   // "16:00"
}

interface ShiftCreationAttributes extends Optional<ShiftAttributes, 'id'> { }

export class Shift extends Model<ShiftAttributes, ShiftCreationAttributes> implements ShiftAttributes {
    public id!: number;
    public name!: string;
    public startHour!: string;
    public endHour!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Shift.init(
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
        startHour: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        endHour: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'shifts',
    }
);
