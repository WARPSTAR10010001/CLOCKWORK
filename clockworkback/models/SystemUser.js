const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const SystemUser = sequelize.define('SystemUser', {
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    password_hash: { type: DataTypes.TEXT, allowNull: false },
    role: { 
        type: DataTypes.ENUM('admin', 'moderator', 'default'), 
        allowNull: false 
    },
    department: { type: DataTypes.STRING, allowNull: true }
}, {
    tableName: 'system_users',
    timestamps: false
});

module.exports = SystemUser;