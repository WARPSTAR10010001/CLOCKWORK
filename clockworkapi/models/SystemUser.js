module.exports = (sequelize, DataTypes) => {
    const SystemUser = sequelize.define('SystemUser', {
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'user' // z.B. 'user', 'moderator', 'admin'
        }
    }, {
        tableName: 'system_users',
        timestamps: false,
    });

    SystemUser.associate = (models) => {
        SystemUser.belongsTo(models.Department, { foreignKey: 'department_id' });
    };

    return SystemUser;
};