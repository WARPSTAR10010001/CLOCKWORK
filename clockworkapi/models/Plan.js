'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Plan extends Model {
    static associate(models) {
      // HIER IST DIE WICHTIGE ÄNDERUNG:
      // Wir fügen die 'through' Option hinzu und verweisen auf das neue Modell.
      Plan.belongsToMany(models.Employee, {
        through: models.PlanEmployee, // Das Verbindungsmodell
        foreignKey: 'planId',         // Der Fremdschlüssel in der Verbindungstabelle, der auf Plan verweist
        otherKey: 'employeeId'        // Der Fremdschlüssel für die andere Seite der Beziehung
      });
    }
  }
  Plan.init({
    // ... deine bisherigen Spaltendefinitionen für Plan ...
    name: DataTypes.STRING,
    // usw.
  }, {
    sequelize,
    modelName: 'Plan',
  });
  return Plan;
};