const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Employee = sequelize.define('Employee', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    department_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'departments',
            key: 'id'
        }
    },
    hire_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    termination_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    }
}, {
    tableName: 'employees',
    timestamps: false
});

module.exports = Employee;