'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Employee extends Model {
    static associate(models) {
      // HIER IST DIE ANPASSUNG:
      // Wir definieren die Many-to-Many-Beziehung zu 'Plan'
      // und geben an, dass 'PlanEmployee' die Verbindungstabelle ist.
      Employee.belongsToMany(models.Plan, {
        through: models.PlanEmployee, // Das Verbindungsmodell
        foreignKey: 'employeeId',     // Der Fremdschlüssel in der Verbindungstabelle, der auf Employee verweist
        otherKey: 'planId'            // Der Fremdschlüssel für die andere Seite (Plan)
      });
    }
  }
  Employee.init({
    // ... deine bisherigen Spaltendefinitionen für Employee ...
    username: DataTypes.STRING,
    password: DataTypes.STRING, // Wichtig: Passwörter sollten immer gehasht gespeichert werden!
    // usw.
  }, {
    sequelize,
    modelName: 'Employee',
  });
  return Employee;
};