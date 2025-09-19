module.exports = (sequelize, DataTypes) => {
    const Employee = sequelize.define('Employee', {
        employee_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        first_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        }
    }, {
        tableName: 'employees',
        timestamps: false
    });

    Employee.associate = (models) => {
        Employee.belongsTo(models.Department, { foreignKey: 'department_id' });
        Employee.belongsToMany(models.Plan, { through: models.PlanMembership, foreignKey: 'employee_id' });
        Employee.hasMany(models.PlanEntry, { foreignKey: 'employee_id' });
    };

    return Employee;
};