const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Holiday = sequelize.define('Holiday', {
  holiday_date: { type: DataTypes.DATEONLY, allowNull: false, unique: true },
  name: { type: DataTypes.STRING }
}, { tableName: 'holidays', timestamps: false });

module.exports = Holiday;