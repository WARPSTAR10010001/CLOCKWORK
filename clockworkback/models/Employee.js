const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Department = require('./Department'); // Annahme, dass es ein Department-Modell gibt
const Plan = require('./Plan');
const PlanMembership = require('./PlanMembership');

const Employee = sequelize.define('Employee', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    department_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Department,
            key: 'id'
        },
        allowNull: false
    }
}, {
    tableName: 'employees',
    timestamps: false
});

// Definiere die Many-to-Many-Beziehung
Employee.belongsToMany(Plan, { through: PlanMembership, foreignKey: 'employee_id' });

module.exports = Employee;