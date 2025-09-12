const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Plan = sequelize.define('Plan', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Das Jahr, für das dieser Plan gilt, z.B. 2025'
    },
    department_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'departments', // Name der referenzierten Tabelle
            key: 'id'
        }
    }
}, {
    tableName: 'plans',
    timestamps: false,
    indexes: [
        {
            // Dieser Index stellt sicher, dass die Kombination aus Jahr und Abteilung einzigartig ist.
            // Es kann also nicht zwei Pläne für die Finanzabteilung im Jahr 2025 geben.
            unique: true,
            fields: ['year', 'department_id']
        }
    ]
});

module.exports = Plan;