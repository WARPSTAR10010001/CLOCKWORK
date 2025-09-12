const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const PlanEntry = sequelize.define('PlanEntry', {
    plan_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'plans',
            key: 'id'
        }
    },
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'employees',
            key: 'id'
        }
    },
    entry_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    entry_type: {
        type: DataTypes.STRING(10),
        allowNull: false
    }
}, {
    tableName: 'plan_entries',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['employee_id', 'entry_date']
        }
    ]
});

module.exports = PlanEntry;