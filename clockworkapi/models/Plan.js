const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Department = require('./Department');
const Employee = require('./Employee');
const PlanMembership = require('./PlanMembership');

const Plan = sequelize.define('Plan', {
    year: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
    tableName: 'plans',
    timestamps: false
});

// Definiere die Many-to-Many-Beziehung
Plan.belongsToMany(Employee, { through: PlanMembership, foreignKey: 'plan_id' });


module.exports = Plan;