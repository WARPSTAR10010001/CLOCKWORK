// Dies ist eine Zwischentabelle für die Many-to-Many-Beziehung
module.exports = (sequelize, DataTypes) => {
    const PlanMembership = sequelize.define('PlanMembership', {
        plan_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'plans',
                key: 'plan_id'
            }
        },
        employee_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'employees',
                key: 'employee_id'
            }
        }
    }, {
        tableName: 'plan_memberships',
        timestamps: false
    });

    return PlanMembership;
};