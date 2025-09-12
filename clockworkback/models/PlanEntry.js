const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Employee = require('./Employee');

const PlanEntry2025 = sequelize.define('PlanEntry2025', {
  date: { type: DataTypes.DATEONLY, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false }
});

PlanEntry2025.belongsTo(Employee, { foreignKey: 'employee_id' });

module.exports = PlanEntry2025;