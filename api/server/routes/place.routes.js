const { Router } = require("express");
const auth = require("../middleware/auth");
const authAdmin = require("../middleware/authAdmin");

const PlaceController = require("../controllers/place.controller");
const placeRoutes = Router();

placeRoutes
  .get("/", PlaceController.getAllPlaces)
  .get("/landmarks", PlaceController.getLandmarkPlaces)
  .post("/", PlaceController.createPlace)
  .delete("/:id", PlaceController.deletePlaceById)
  .delete("/", PlaceController.deleteAllPlace)
  .put("/:id", PlaceController.updatePlace);

module.exports = placeRoutes;
