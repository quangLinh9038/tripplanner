const { Op } = require("sequelize");

/**
 * Import services
 */
const PlaceNeo4jService = require("../../neo4j/service/place.neo4j.service");
const PlaceService = require("../service/place.service");

const PlaceController = {
  getAllPlaces: async (req, res) => {
    try {
      /**
       * Get params
       */
      const {
        name,
        isHistorical,
        isUrban,
        isReligious,
        isMuseum,
        isShopping,
        isPark,
        isAdventure,
        isNature,
      } = req.query;

      /***
       * Define conditions for query
       */
      var condition = name ? { name: { [Op.iLike]: `%${name}%` } } : null;
      var condition1 = isHistorical ? { isHistorical: { [Op.eq]: 1 } } : null;
      var condition2 = isUrban ? { isUrban: { [Op.eq]: 1 } } : null;
      var condition3 = isReligious ? { isReligious: { [Op.eq]: 1 } } : null;
      var condition4 = isMuseum ? { isMuseum: { [Op.eq]: 1 } } : null;
      var condition5 = isShopping ? { isShopping: { [Op.eq]: 1 } } : null;
      var condition6 = isAdventure ? { isAdventure: { [Op.eq]: 1 } } : null;
      var condition7 = isNature ? { isNature: { [Op.eq]: 1 } } : null;
      var condition8 = isPark ? { isPark: { [Op.eq]: 1 } } : null;

      const conditionList = [
        condition,
        condition1,
        condition2,
        condition3,
        condition4,
        condition5,
        condition6,
        condition7,
        condition8,
      ];

      /***
       * Set statement of condition is null
       * to check every object whether null or not
       */
      const isEveryObjectNull = (condition) => condition === null;

      /**
       * If conditionList has one ore more conditions --> query conditional Places
       *
       * If not, query all Places from db
       */
      if (!conditionList.every(isEveryObjectNull)) {
        const conditionalPlaces = await PlaceService.getConditionalPlaces(
          conditionList
        );

        /**
         * Check found Places
         * */
        return !conditionalPlaces.length
          ? res
              .status(404)
              .json({ status: "failure", message: `Places not found` })
          : res.json({
              status: "success",
              result: conditionalPlaces.length,
              data: conditionalPlaces,
            });
      }
      /**
       * If conditions are every null
       * return GET all places routes
       */
      const allPlaces = await PlaceService.getAllPlaces();

      return !allPlaces.length
        ? res.status(404).send({ message: `Places are empty` })
        : res.json({
            status: "success",
            result: allPlaces.length,
            data: allPlaces,
          });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // get landmark places matched with user's interests
  getLandmarkPlaces: async (req, res) => {
    try {
      const placeParams = req.query.interests;
      const limit = req.query.limit;
      const duplicatedPlace = null;

      const places = await PlaceService.getAllPlaces();
      if (!places.length) {
        return res
          .status(404)
          .json({ status: "failure", message: "Places are empty" });
      }

      if (!placeParams.length || !limit) {
        return res
          .status(400)
          .json({ status: "failure", message: "Missing params" });
      }

      const landmarkPlaces = await PlaceService.getLandmarkPlaces(
        placeParams,
        limit,
        duplicatedPlace
      );

      return !landmarkPlaces.length
        ? res.status(404).json({
            status: "failure",
            message: "Landmark places not found",
          })
        : res.status(200).json({
            status: "success",
            results: landmarkPlaces.length,
            data: landmarkPlaces,
          });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  // create new places
  createPlace: async (req, res) => {
    try {
      const newPlaces = req.body;
      const existedPlaceList = [];

      if (!newPlaces.length) {
        return res
          .status(400)
          .json({ status: "failure", message: "Missing request body" });
      }
      /*  
      Check for each element of array places
      whether existed place
      */
      for (const place of newPlaces) {
        const existedPlace = await PlaceService.getOnePlace(place.name);
        if (existedPlace) {
          existedPlaceList.push(existedPlace.name);
        }
      }

      /**
       * If there is none of existed places
       * create new places
       * If not, return existed error messages
       */
      if (Array.isArray(existedPlaceList) && !existedPlaceList.length) {
        /**
         * Use sequelize create() method
         * to POST data of places to Postgres
         */
        const _newPlaces = await PlaceService.createPlaces(newPlaces);
        // console.log(
        //   "🚀 ~ file: place.controller.js ~ line 183 ~ createPlace: ~ _newPlaces",
        //   _newPlaces
        // );

        if (!_newPlaces.length) {
          return res
            .status(500)
            .json({ msg: "Cannot create Places to Postgresql database." });
        }

        /**
         * @param {props} properties of Place nodes containing {name, lat, lng, unique_point}
         **/
        for (const place of _newPlaces) {
          const props = place.dataValues;
          await PlaceNeo4jService.createPlace(props);
        }

        /* 
          Init relationship between new Place label to Accommodation and Cuisine
        */
        await PlaceNeo4jService.initRelationshipToAccommodation();
        await PlaceNeo4jService.initRelationshipToCuisine();

        return res.status(201).json({
          status: "success",
          results: _newPlaces.length,
          data: _newPlaces,
        });
      }
      return res.status(400).json({
        status: "failure",
        message: `Places [ ${existedPlaceList} ] are existed`,
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  deletePlaceById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id)
        return res
          .status(400)
          .json({ status: "failure", message: "Missing id params" });

      const placeToDelete = await PlaceService.getPlaceById(id);

      if (placeToDelete) {
        await PlaceService.deletePlaceById(id);
        await PlaceNeo4jService.deleteOneNode(placeToDelete.unique_point);
        return res.status(200).send({
          status: "success",
          message: `Place with the  ${id} has been deleted successfully`,
        });
      }

      return res.status(404).json({
        status: "failure",
        message: `Place: ${id} not found`,
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  async updatePlace(req, res) {
    try {
      const updatePlace = req.body;
      const { id } = req.params;

      if (!updatePlace || !id)
        return res
          .status(404)
          .json({ status: "failure", message: "Missing params or body" });

      const placeToUpdate = await PlaceService.getPlaceById(id);
      const unique_point = placeToUpdate.unique_point;

      if (placeToUpdate) {
        await PlaceService.updatePlace(id, updatePlace);
        await PlaceNeo4jService.updatePlace(unique_point, updatePlace);
        return res.status(200).send({
          status: "success",
          message: `Place with ${id} is updated successfully`,
        });
      }

      return res.status(404).send({
        status: "failure",
        message: `Place with ${id} not found!`,
      });
    } catch (err) {
      return res.status(500).send({ msg: err.message });
    }
  },

  deleteAllPlace: async (req, res) => {
    try {
      const placesToDelete = await PlaceService.getAllPlaces();

      if (!placesToDelete.length) {
        return res.status(404).send({
          message: "Empty list!",
        });
      }
      await PlaceService.deleteAllPlaces();
      await PlaceNeo4jService.deletePlaces();

      return res.status(200).json({
        status: "success",
        message: "Deleted all places!",
      });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
};

module.exports = PlaceController;
