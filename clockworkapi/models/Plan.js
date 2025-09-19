module.exports = (sequelize, DataTypes) => {
    const Plan = sequelize.define('Plan', {
        plan_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        month: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    }, {
        tableName: 'plans',
        timestamps: false,
    });

    Plan.associate = (models) => {
        Plan.belongsTo(models.Department, { foreignKey: 'department_id' });
        Plan.belongsToMany(models.Employee, { through: models.PlanMembership, foreignKey: 'plan_id' });
        Plan.hasMany(models.PlanEntry, { foreignKey: 'plan_id' });
    };

    return Plan;
};