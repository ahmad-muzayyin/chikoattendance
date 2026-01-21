// d:\AHMAD MUZAYYIN\ChikoAttendance\backend\src\models\Branch.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';

interface BranchAttributes {
    id: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    radius: number; // in meters
    startHour: string; // e.g., "08:00"
    endHour: string;   // e.g., "17:00"
}

interface BranchCreationAttributes extends Optional<BranchAttributes, 'id' | 'radius' | 'startHour' | 'endHour'> { }

export class Branch extends Model<BranchAttributes, BranchCreationAttributes> implements BranchAttributes {
    public id!: number;
    public name!: string;
    public address!: string;
    public latitude!: number;
    public longitude!: number;
    public radius!: number;
    public startHour!: string;
    public endHour!: string;
    public readonly Users?: import('./User').User[];

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Branch.init(
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
        address: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        latitude: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        longitude: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        radius: {
            type: DataTypes.INTEGER,
            defaultValue: 100, // Default 100 meters
        },
        startHour: {
            type: DataTypes.STRING, // Store as "HH:mm"
            defaultValue: "09:00",
        },
        endHour: {
            type: DataTypes.STRING, // Store as "HH:mm"
            defaultValue: "17:00",
        }
    },
    {
        sequelize,
        tableName: 'branches',
    }
);
