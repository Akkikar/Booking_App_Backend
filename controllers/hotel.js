import mongoose from "mongoose";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import nodemailer from "nodemailer";
import User from "../models/User.js";

const transporter = nodemailer.createTransport({
  service: "gmail", 
  auth: {
    user: "akashkarlapudi24@gmail.com",
    pass: "evlomcdjljmjvzjh",
  },
});
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP Error:", error);
  }
});

export const createHotel = async (req, res, next) => {
  const newHotel = new Hotel(req.body);

  try {
    const savedHotel = await newHotel.save();
    console.log("Hotel saved:", savedHotel);

    if (savedHotel.cheapestprice <= 100) {
      console.log("Cheapest price condition met, fetching users...");
      const users = await User.find({});
      console.log("Users fetched:", users);

      const emailPromises = users.map((user) => {
        const mailOptions = {
          from: "akashkarlapudi24@gmail.com",
          to: user.email,
          subject: "Hurry Up! Room Prices Decreased",
          text: `Hi ${user.username},\n\nHurry up! Book your rooms at ${
            savedHotel.name
          }.\n\nThe room price is now just $${savedHotel.cheapestprice}!\n\nBest Regards,\nYour Booking Team`,
        };

        console.log("Sending email to:", user.email);
        return transporter.sendMail(mailOptions);
      });

      await Promise.all(emailPromises);
      console.log("Emails sent to all users.");
    }

    res.status(200).json(savedHotel);
  } catch (err) {
    console.error("Error:", err);
    next(err);
  }
};

export const updateHotel = async (req, res, next) => {
  try {
    const updatedHotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true } 
    );

    
    if (updatedHotel.cheapestprice <= 100) {
      
      const users = await User.find({}); 

      const emailPromises = users.map((user) => {
        const mailOptions = {
          from: "hotelbooking@gmail.com", 
          to: user.email, 
          subject: "Hurry Up! Room Prices Decreased",
          text: `Hi ${user.username},\n\nHurry up! Book your rooms at ${
            updatedHotel.name
          }.\n\nThe room price is now just $${updatedHotel.cheapestPrice}!\n\nBest Regards,\nYour Booking Team`,
        };

        return transporter.sendMail(mailOptions);
      });

      await Promise.all(emailPromises);

      console.log("Emails sent to all users.");
    }

    res.status(200).json(updatedHotel);
  } catch (err) {
    next(err);
  }
};

export const addRoomsToHotel = async (req, res) => {
  const hotelId = req.params.id;
  const { roomIds } = req.body; 

  try {
    
    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

   
    hotel.rooms = [...hotel.rooms, ...roomIds]; 

    await hotel.save();
    
    res.status(200).json({ message: "Rooms added successfully", hotel });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add rooms to hotel" });
  }
};
export const deleteHotel = async (req, res, next) => {
  try {
    await Hotel.findByIdAndDelete(req.params.id);
    res.status(200).json("Hotel has been deleted.");
  } catch (err) {
    next(err);
  }
};
export const getHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    res.status(200).json(hotel);
  } catch (err) {
    next(err);
  }
};

export const getFeaturedHotels = async (req, res, next) => {
  try {
   
    const featuredHotels = await Hotel.find({ featured: true });

    if (featuredHotels.length === 0) {
      return res.status(404).json({ message: "No featured hotels found" });
    }

    res.status(200).json(featuredHotels);
  } catch (err) {
    next(err); 
  }
};


export const getHotels = async (req, res, next) => {
  try {
    const { min, max, ...filters } = req.query;

    const query = {};

   
    if (Object.keys(filters).length > 0) {
      for (const key in filters) {
        const value = filters[key];

        if (typeof value === "string") {
          query[key] = { $regex: value, $options: "i" };
        } else if (key === "featured") {
          query[key] = value === "true"; 
        } else if (typeof value === "number") {
          query[key] = value;
        } else {
          query[key] = value;
        }
      }
    }

    if (min || max) {
      query.cheapestprice = {};
      if (min) query.cheapestprice.$gte = parseFloat(min);
      if (max) query.cheapestprice.$lte = parseFloat(max);

      if (min && isNaN(min)) {
        return res.status(400).json({ message: "Min price must be a number" });
      }
      if (max && isNaN(max)) {
        return res.status(400).json({ message: "Max price must be a number" });
      }
    }

    const limit = Math.min(Number(req.query.limit) || 10, 100); 

    const hotels = await Hotel.find(query).limit(limit);

    if (hotels.length === 0) {
      return res.status(404).json({ message: "No hotels found matching your criteria" });
    }

    res.status(200).json(hotels);
  } catch (err) {
    console.error("Error in getHotels:", err);
    next(err); 
  }
};



export const countByCity = async (req, res, next) => {
  const cities = req.query.cities ? req.query.cities.split(",") : []; 
  if (!cities.length) {
    return res.status(400).json({ message: "No cities provided" });
  }
  try {
    const list = await Promise.all(
      cities.map((city) => {
        return Hotel.countDocuments({ city: city });
      })
    );
    res.status(200).json(list);
  } catch (err) {
    next(err);
  }
};

export const countByType = async (req, res, next) => {
  try {
    const hotelCount = await Hotel.countDocuments({ type: "Hotel" });
    const apartmentCount = await Hotel.countDocuments({ type: "Apartment" });
    const resortCount = await Hotel.countDocuments({ type: "Resort" });
    const villaCount = await Hotel.countDocuments({ type: "Villa" });
    const cabinCount = await Hotel.countDocuments({ type: "Cabin" });

    res.status(200).json([
      { type: "Hotel", count: hotelCount },
      { type: "Apartments", count: apartmentCount },
      { type: "Resorts", count: resortCount },
      { type: "Villas", count: villaCount },
      { type: "Cabins", count: cabinCount },
    ]);
  } catch (err) {
    next(err);
  }
};

export const getHotelRooms = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }
    const roomPromises = hotel.rooms.map((roomId) => {
      if (mongoose.Types.ObjectId.isValid(roomId)) {
        return Room.findById(roomId);
      } else {
        console.warn(`Invalid ObjectId: ${roomId}`);
        return null;
      }
    });
    const rooms = await Promise.all(roomPromises);
    const validRooms = rooms.filter(room => room !== null);
    res.status(200).json(validRooms);
  } catch (err) {
    next(err); 
  }
};