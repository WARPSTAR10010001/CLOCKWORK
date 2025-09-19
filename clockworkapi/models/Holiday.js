module.exports = (sequelize, DataTypes) => {
    const Holiday = sequelize.define('Holiday', {
        holiday_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        holiday_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        holiday_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
    }, {
        tableName: 'holidays',
        timestamps: false,
    });

    // Holidays haben in diesem Schema keine direkten Assoziationen zu anderen Tabellen
    // Falls doch, hier die .associate Methode hinzufügen

    return Holiday;
};