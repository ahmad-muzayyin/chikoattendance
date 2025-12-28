import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';

interface SettingsAttributes {
    key: string;
    value: string;
}

interface SettingsCreationAttributes extends Optional<SettingsAttributes, 'value'> { }

class Settings extends Model<SettingsAttributes, SettingsCreationAttributes> implements SettingsAttributes {
    public key!: string;
    public value!: string;
}

Settings.init({
    key: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    value: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize,
    tableName: 'settings',
    timestamps: false
});

export default Settings;
