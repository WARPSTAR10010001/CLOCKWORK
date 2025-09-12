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
    vacation_days_last_year: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    vacation_days_current_year: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    }
}, {
    tableName: 'employees',
    timestamps: false
});

module.exports = Employee;