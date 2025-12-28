// d:\AHMAD MUZAYYIN\ChikoAttendance\backend\src\models\Attendance.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import { User } from './User';

export enum AttendanceType {
    CHECK_IN = 'CHECK_IN',
    CHECK_OUT = 'CHECK_OUT',
    PERMIT = 'PERMIT',
    SICK = 'SICK',
    ALPHA = 'ALPHA'
}

interface AttendanceAttributes {
    id: number;
    userId: number;
    type: AttendanceType;
    timestamp: Date;
    latitude: number;
    longitude: number;
    deviceId: string;
    isLate: boolean;
    isOvertime: boolean;
    isHalfDay: boolean; // Computed if late > 1 hour
    notes?: string;
    photoUrl?: string;
}

interface AttendanceCreationAttributes extends Optional<AttendanceAttributes, 'id' | 'isLate' | 'isOvertime' | 'isHalfDay' | 'notes' | 'photoUrl'> { }

export class Attendance extends Model<AttendanceAttributes, AttendanceCreationAttributes> implements AttendanceAttributes {
    public id!: number;
    public userId!: number;
    public type!: AttendanceType;
    public timestamp!: Date;
    public latitude!: number;
    public longitude!: number;
    public deviceId!: string;
    public isLate!: boolean;
    public isOvertime!: boolean;
    public isHalfDay!: boolean;
    public notes!: string;
    public photoUrl!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Attendance.init(
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
            type: DataTypes.ENUM(...Object.values(AttendanceType)),
            allowNull: false,
        },
        timestamp: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        latitude: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        longitude: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        deviceId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        isLate: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        isOvertime: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        isHalfDay: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        notes: {
            type: DataTypes.STRING,
            allowNull: true
        },
        photoUrl: {
            type: DataTypes.TEXT('long'), // Use LONGTEXT for Base64 images from Expo
            allowNull: true
        }
    },
    {
        sequelize,
        tableName: 'attendance',
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['timestamp']
            }
        ]
    }
);

User.hasMany(Attendance, { foreignKey: 'userId' });
Attendance.belongsTo(User, { foreignKey: 'userId' });
