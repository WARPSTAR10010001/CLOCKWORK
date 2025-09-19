const { Sequelize } = require('sequelize').sequelize;
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

const Department = require('./models/Department');
const Employee = require('./models/Employee');
const Holiday = require('./models/Holiday');
const Plan = require('./models/Plan');
const PlanEntry = require('./models/PlanEntry');
const PlanMembership = require('./models/PlanMembership');
const SystemUser = require('./models/SystemUser');

Department.hasMany(SystemUser, { foreignKey: 'department_id' });
SystemUser.belongsTo(Department, { foreignKey: 'department_id' });

Department.hasMany(Employee, { foreignKey: 'department_id' });
Employee.belongsTo(Department, { foreignKey: 'department_id' });

Department.hasMany(Plan, { foreignKey: 'department_id' });
Plan.belongsTo(Department, { foreignKey: 'department_id' });

Plan.belongsToMany(Employee, { through: PlanMembership, foreignKey: 'plan_id' });
Employee.belongsToMany(Plan, { through: PlanMembership, foreignKey: 'employee_id' });

Plan.hasMany(PlanEntry, { foreignKey: 'plan_id' });
PlanEntry.belongsTo(Plan, { foreignKey: 'plan_id' });

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