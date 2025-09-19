const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Department = sequelize.define('Department', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'departments',
    timestamps: false
});

module.exports = Department;