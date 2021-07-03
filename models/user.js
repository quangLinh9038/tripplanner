const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class user extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      user.hasMany(models.Interest, {
        foreignKey: 'user_id',
        as: 'interests',
      });
    }
  };
  user.init({
    name: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'user',
  });
  return user;
};
