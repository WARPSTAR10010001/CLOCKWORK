const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Plan = require('./Plan');
const Employee = require('./Employee');

const PlanMembership = sequelize.define('PlanMembership', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    plan_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Plan,
            key: 'id'
        },
        allowNull: false
    },
    employee_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Employee,
            key: 'id'
        },
        allowNull: false
    },
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: true // Optional
    },
    end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true // Optional
    },
    vacation_days_carryover: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    vacation_days_total: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'plan_memberships',
    timestamps: false
});

module.exports = PlanMembership;