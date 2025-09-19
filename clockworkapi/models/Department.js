module.exports = (sequelize, DataTypes) => {
    const Department = sequelize.define('Department', {
        department_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        department_name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }
    }, {
        tableName: 'departments',
        timestamps: false
    });

    Department.associate = (models) => {
        Department.hasMany(models.SystemUser, { foreignKey: 'department_id' });
        Department.hasMany(models.Employee, { foreignKey: 'department_id' });
        Department.hasMany(models.Plan, { foreignKey: 'department_id' });
    };

    return Department;
};