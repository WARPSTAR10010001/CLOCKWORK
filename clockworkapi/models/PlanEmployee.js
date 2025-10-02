'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PlanEmployee extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  PlanEmployee.init({
    // Es ist oft eine gute Praxis, der Verbindungstabelle eine eigene ID zu geben.
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    // Fremdschlüssel zum Plan-Modell
    planId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Plans', // Name der Tabelle in der Datenbank
        key: 'id'
      }
    },
    // Fremdschlüssel zum Employee-Modell
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Employees', // Name der Tabelle in der Datenbank
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'PlanEmployee',
    // Optional: Den Tabellennamen explizit setzen
    // tableName: 'plan_employees'
  });
  return PlanEmployee;
};