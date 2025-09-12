const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const SystemUser = sequelize.define('SystemUser', {
    username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    password_hash: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('admin', 'mod', 'user'),
        allowNull: false
    },
    department_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'departments',
            key: 'id'
        }
    }
}, {
    tableName: 'system_users',
    timestamps: false
});

module.exports = SystemUser;