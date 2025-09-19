module.exports = (sequelize, DataTypes) => {
    const PlanEntry = sequelize.define('PlanEntry', {
        entry_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        entry_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        tableName: 'plan_entries',
        timestamps: false,
    });

    PlanEntry.associate = (models) => {
        PlanEntry.belongsTo(models.Plan, { foreignKey: 'plan_id' });
        PlanEntry.belongsTo(models.Employee, { foreignKey: 'employee_id' });
    };

    return PlanEntry;
};