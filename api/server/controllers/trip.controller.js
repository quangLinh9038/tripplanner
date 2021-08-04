const TripService = require("../service/trip.service");
const TripNeo4jService = require("../../neo4j/service/trip.neo4j.service");

const TripController = {
  getAllTrips: async (req, res) => {
    try {
      const trips = await TripService.getAllTrips();

      if (trips.length === null) {
        return res.status(204).send({ msg: `Empty Trips` });
      }

      return res.status(200).json(trips);
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  /**
   * GET the shortest Accommodation from landmark Place
   * Return Accommodation {unique_point} to show info
   */

  getShortestAccommodationFromMainPlace: async (req, res) => {
    try {
      const { placeParam1, placeParam2 } = req.query;
      const placeParams = [placeParam1, placeParam2];
      // console.log(`place in controller: ${placeParams}`);

      const { accommodationParams } = req.query;
      // console.log(`a_param in controller: ${accomms_point}`);

      const result = await TripService.getSuggestedTrip(
        placeParams,
        accommodationParams
      );

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ msg: error });
    }
  },

  createTrip: async (req, res) => {
    try {
    } catch (error) {}
  },
};

module.exports = TripController;
