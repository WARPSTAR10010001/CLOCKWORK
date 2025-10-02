module.exports = (sequelize, DataTypes) => {
    const Employee = sequelize.define('Employee', {
        id: {
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
        department_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, { tableName: 'employees', timestamps: false });

    Employee.associate = (models) => {
        // Beziehung zum Department (war bereits korrekt)
        Employee.belongsTo(models.Department, {
            foreignKey: 'department_id'
        });

        // NEU: Ein Mitarbeiter hat viele einzelne Einträge in Dienstplänen
        Employee.hasMany(models.PlanEntry, {
            foreignKey: 'employee_id'
        });

        // KORRIGIERT: Definiert die Viele-zu-Viele-Beziehung ZU Plänen
        // Sequelize wird automatisch eine Tabelle "plan_memberships" erstellen,
        // um die Verbindungen zu speichern.
        Employee.belongsToMany(models.Plan, {
            through: 'plan_memberships', // Name der Zwischentabelle
            foreignKey: 'employee_id',
            otherKey: 'plan_id',
            timestamps: false
        });
    };

    return Employee;
};