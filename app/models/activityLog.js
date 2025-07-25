const { Model, DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  class ActivityLog extends Model {
    static associate(models) {
      ActivityLog.belongsTo(models.UserRevision, {
        foreignKey: 'revisionId',
        targetKey: 'id',
        constraints: false,
        as: 'userRevision'
      })

      ActivityLog.belongsTo(models.User, {
        foreignKey: 'changedById',
        as: 'changedByUser'
      })
    }
  }

  ActivityLog.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      revisionTable: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'revision_table'
      },
      revisionId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'revision_id'
      },
      entityType: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'entity_type'
      },
      entityId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'entity_id'
      },
      revisionNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'revision_number'
      },
      action: {
        type: DataTypes.ENUM('create', 'update', 'delete'),
        allowNull: false,
        defaultValue: 'update',
        validate: {
          isIn: [['create', 'update', 'delete']]
        }
      },
      changedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'changed_at'
      },
      changedById: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'changed_by_id'
      }
    },
    {
      sequelize,
      modelName: 'ActivityLog',
      tableName: 'activity_logs',
      underscored: true
    }
  )

  return ActivityLog
}
