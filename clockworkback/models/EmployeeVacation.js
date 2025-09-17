const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Employee = require('./Employee');

const EmployeeVacation = sequelize.define('EmployeeVacation', {
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Employee,
            key: 'id'
        }
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    vacation_days_previous_year: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    vacation_days_current_year: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'employee_vacations',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['employee_id', 'year']
        }
    ]
});

Employee.hasMany(EmployeeVacation, { foreignKey: 'employee_id' });
EmployeeVacation.belongsTo(Employee, { foreignKey: 'employee_id' });

module.exports = EmployeeVacation;