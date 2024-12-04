import express from "express";
import {
  countByCity,
  countByType,
  createHotel,
  deleteHotel,
  getHotel,
  getHotelRooms,
  getHotels,
  updateHotel,
  addRoomsToHotel,
  getFeaturedHotels
} from "../controllers/hotel.js";
import Hotel from "../models/Hotel.js";
import {verifyAdmin} from "../utils/verifyToken.js"
const router = express.Router();

//CREATE
router.post("/", verifyAdmin, createHotel);

//UPDATE

router.put("/:id", verifyAdmin, updateHotel);
router.put("/:id/add-rooms", verifyAdmin, addRoomsToHotel);
//DELETE
router.delete("/:id", verifyAdmin, deleteHotel);
//GET
router.get("/featured",getFeaturedHotels)
router.get("/countByCity", countByCity);
router.get("/countByType", countByType);
router.get("/:id", getHotel);

//GET ALL

router.get("/", getHotels);

router.get("/room/:id", getHotelRooms);

export default router;