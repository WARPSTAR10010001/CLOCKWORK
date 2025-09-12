const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Employee = sequelize.define('Employee', {
  username: { type: DataTypes.STRING, allowNull: false },
  department: { type: DataTypes.STRING, allowNull: false },
  start_date: { type: DataTypes.DATEONLY, allowNull: false },
  end_date: { type: DataTypes.DATEONLY },
  total_vacation: { type: DataTypes.INTEGER, defaultValue: 30 },
  carry_over: { type: DataTypes.INTEGER, defaultValue: 0 }
});

module.exports = Employee;