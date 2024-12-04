import Room from "../models/Room.js";
import Hotel from "../models/Hotel.js";
import { createError } from "../utils/error.js";
import nodemailer from "nodemailer";

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
  } else {
    console.log("SMTP Server is ready to send emails");
  }
});

export const createRoom = async (req, res, next) => {
  const hotelId = req.params.hotelid;
  const newRoom = new Room(req.body);

  try {
    const savedRoom = await newRoom.save();
    try {
      await Hotel.findByIdAndUpdate(hotelId, {
        $push: { rooms: savedRoom._id },
      });
    } catch (err) {
      next(err);
    }
    res.status(200).json(savedRoom);
  } catch (err) {
    next(err);
  }
};

export const updateRoom = async (req, res, next) => {
  try {
    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(updatedRoom);
  } catch (err) {
    next(err);
  }
};

export const updateRoomAvailability = async (req, res, next) => {
  try {
   
    const room = await Room.updateOne(
      { "roomNumbers._id": req.params.id },
      {
        $push: {
          "roomNumbers.$.unavailableDates": req.body.dates, 
        },
      }
    );

    
    if (room.nModified > 0) {
      const userEmail = req.body.email;  
      const hotelName = req.body.name;  
      const roomDetails = `Room: ${req.body.roomNumbers}`;
      const checkInDate = req.body.startDate; 
      const checkOutDate = req.body.endDate; 

     
      const mailOptions = {
        from: "akashkarlapudi24@gmail.com",
        to: userEmail,
        subject: "Room Booking Confirmation",
        text: `
          Hi,

          Your room has been successfully booked at ${hotelName}.

          Room Details:
          ${roomDetails}

          Check-in Date: ${checkInDate}
          Check-out Date: ${checkOutDate}

          Thank you for booking with us!

          Best regards,
          Your Booking Team
        `,
      };

      
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
        } else {
          console.log("Email sent successfully:", info.response);
        }
      });
    }

    res.status(200).json("Room status has been updated and email sent.");
  } catch (err) {
    console.error("Error updating room availability:", err);
    next(err);
  }
};




export const deleteRoom = async (req, res, next) => {
  const hotelId = req.params.hotelid;
  try {
    await Room.findByIdAndDelete(req.params.id);
    try {
      await Hotel.findByIdAndUpdate(hotelId, {
        $pull: { rooms: req.params.id },
      });
    } catch (err) {
      next(err);
    }
    res.status(200).json("Room has been deleted.");
  } catch (err) {
    next(err);
  }
};
export const getRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    res.status(200).json(room);
  } catch (err) {
    next(err);
  }
};
export const getRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find();
    res.status(200).json(rooms);
  } catch (err) {
    next(err);
  }
};