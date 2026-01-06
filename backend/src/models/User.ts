import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import { Branch } from './Branch';
import { Shift } from './Shift';

export enum UserRole {
    ADMIN = 'ADMIN',
    OWNER = 'OWNER',
    HEAD = 'HEAD', // Kepala Toko
    SUPERVISOR = 'SUPERVISOR', // Pengawas
    EMPLOYEE = 'EMPLOYEE',
}

interface UserAttributes {
    id: number;
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    branchId?: number | null;
    shiftId?: number | null; // Optional Shift
    profile_picture?: string | null;
    pushToken?: string | null;
    position?: string | null;
    googleId?: string | null;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'branchId' | 'shiftId'> {
    password?: string; // Allow password during creation
}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: number;
    public name!: string;
    public email!: string;
    public passwordHash!: string;
    public role!: UserRole;
    public branchId!: number | null;
    public shiftId!: number | null;
    public profile_picture!: string | null;
    public pushToken!: string | null;
    public position!: string | null;
    public googleId!: string | null;
    public readonly Branch?: Branch;
    public readonly Shift?: Shift;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

User.init(
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
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        passwordHash: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM(...Object.values(UserRole)),
            defaultValue: UserRole.EMPLOYEE,
            allowNull: false,
        },
        branchId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            references: {
                model: Branch,
                key: 'id',
            },
        },
        shiftId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            references: {
                model: Shift,
                key: 'id',
            },
        },
        profile_picture: {
            type: DataTypes.TEXT('long'),
            allowNull: true,
        },
        pushToken: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        position: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'Staff'
        },
        googleId: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        }
    },
    {
        sequelize,
        tableName: 'users',
    }
);

// Define Association
Branch.hasMany(User, { foreignKey: 'branchId' });
User.belongsTo(Branch, { foreignKey: 'branchId' });

Shift.hasMany(User, { foreignKey: 'shiftId' });
User.belongsTo(Shift, { foreignKey: 'shiftId' });
