const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.PG_DATABASE,
    process.env.PG_USER,
    process.env.PG_PASSWORD, {
        host: process.env.PG_HOST || 'localhost',
        dialect: 'postgres',
        logging: false
    }
);

// Importiere alle Modelle
const Department = require('./models/Department');
const Employee = require('./models/Employee');
const Holiday = require('./models/Holiday');
const Plan = require('./models/Plan');
const PlanEntry = require('./models/PlanEntry');
const PlanMembership = require('./models/PlanMembership');
const SystemUser = require('./models/SystemUser');

// Definiere hier ZENTRAL alle Beziehungen, um zirkuläre Abhängigkeiten zu vermeiden

// Department -> SystemUser (One-to-Many)
Department.hasMany(SystemUser, { foreignKey: 'department_id' });
SystemUser.belongsTo(Department, { foreignKey: 'department_id' });

// Department -> Employee (One-to-Many)
Department.hasMany(Employee, { foreignKey: 'department_id' });
Employee.belongsTo(Department, { foreignKey: 'department_id' });

// Department -> Plan (One-to-Many)
Department.hasMany(Plan, { foreignKey: 'department_id' });
Plan.belongsTo(Department, { foreignKey: 'department_id' });

// Plan <-> Employee (Many-to-Many through PlanMembership)
Plan.belongsToMany(Employee, { through: PlanMembership, foreignKey: 'plan_id' });
Employee.belongsToMany(Plan, { through: PlanMembership, foreignKey: 'employee_id' });

// Plan -> PlanEntry (One-to-Many)
Plan.hasMany(PlanEntry, { foreignKey: 'plan_id' });
PlanEntry.belongsTo(Plan, { foreignKey: 'plan_id' });

// Employee -> PlanEntry (One-to-Many)
Employee.hasMany(PlanEntry, { foreignKey: 'employee_id' });
PlanEntry.belongsTo(Employee, { foreignKey: 'employee_id' });


(async () => {
    try {
        await sequelize.authenticate();
        console.log('[START] CLOCKWORK DATENBANK läuft!');
    } catch (err) {
        console.error('[ERROR] CLOCKWORK DATENBANK Interner Fehler', err);
    }
})();

module.exports = sequelize;