const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const imageDownloader = require("image-downloader");
const fs = require("fs");
const cookieParser = require("cookie-parser");

const multer = require("multer");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 4000;
const User = require("./models/user");
const Accommodation = require("./models/accommodation");

const jwtSecret = process.env.JWT_SECRET_KEY;

const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/stayheredb";

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once("open", () => {
  console.log("Connected to the database");
});

db.on("error", (error) => {
  console.error("Database connection error:", error);
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.get("/test", (req, res) => {
  res.send("Hello World!");
});

app.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password, userType } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      userType,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while registering user." });
  }
});

app.post("/check-email", async (req, res) => {
  try {
    const { email } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ available: false });
    }

    res.json({ available: true });
  } catch (error) {
    res.status(500).json({ error: "An error occurred while checking email." });
  }
});

app.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    const token = jwt.sign({ userId: user._id }, jwtSecret, {
      expiresIn: "1h",
    });

    res.status(200).json({
      message: "Sign in successful.",
      token: token,
      userType: user.userType,
      email: user.email,
      userName: user.fullName,
    });
  } catch (error) {
    res.status(500).json({ error: "An error occurred while signing in." });
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;

  if (!token) {
    return res.json(null); // Return null if there's no token
  }

  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) {
      console.error("Token verification error:", err);

      // Clear the token and send a response indicating logout
      res.clearCookie("token");
      return res
        .status(401)
        .json({ message: "Logged out due to token expiration." });
    }

    try {
      const user = await User.findById(userData.userId); // Use "userId" as it's the field set during token signing

      if (!user) {
        console.error("User not found:", userData.userId);

        // Clear the token and send a response indicating logout
        res.clearCookie("token");
        return res.status(401).json({ message: "User not found." });
      }

      res.json({ name: user.fullName, email: user.email, _id: user._id });
    } catch (error) {
      console.error("Error fetching user:", error);
      res
        .status(500)
        .json({ error: "An error occurred while fetching user data." });
    }
  });
});

app.get("/api-users", async (req, res) => {
  try {
    const users = await User.find({}, "_id fullName email userType"); // Modify this to fetch the desired fields

    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while fetching user data." });
  }
});

app.delete("/api-users/:email", async (req, res) => {
  try {
    const email = req.params.email;
    await User.findOneAndDelete({ email }); // Find and delete user by email
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "An error occurred while deleting user." });
  }
});

app.put("/api-users/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const updatedData = req.body;

    await User.findOneAndUpdate({ email }, updatedData);
    res.status(200).json({ message: "User data updated successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while updating user data." });
  }
});

app.post("/upload-by-link", async (req, res) => {
  const { link } = req.body;

  const newName = "photo" + Date.now() + ".jpg";
  await imageDownloader.image({
    url: link,
    dest: __dirname + "/uploads/" + newName,
  });

  res.json(newName);
});

const photosMiddleware = multer({ dest: "uploads" });
app.post("/upload", photosMiddleware.array("photos", 100), (req, res) => {
  const uploadedFiles = [];
  for (let i = 0; i < req.files.length; i++) {
    const { path, originalname } = req.files[i];
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    const newPath = path + "." + ext;

    fs.renameSync(path, newPath);
    uploadedFiles.push(newPath.replace("uploads\\", ""));
  }

  res.json(uploadedFiles);
});

app.post("/accommodation", async (req, res) => {
  try {
    const userId = getUserIdFromToken(req); // Extract user ID from token
    const newAccommodation = new Accommodation({
      ...req.body,
      owner: userId, // Associate the user ID with the accommodation
    });
    const savedAccommodation = await newAccommodation.save();
    res.status(201).json(savedAccommodation);
  } catch (error) {
    res.status(400).json({ error: "Error creating accommodation" });
  }
});

app.put("/accommodation", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserIdFromToken(req); // Extract user ID from token
    const updatedAccommodation = await Accommodation.findOneAndUpdate(
      { _id: id, owner: userId }, // Make sure the user owns the accommodation before updating
      req.body,
      { new: true }
    );
    if (!updatedAccommodation) {
      return res.status(404).json({ error: "Accommodation not found" });
    }
    res.status(200).json(updatedAccommodation);
  } catch (error) {
    res.status(400).json({ error: "Error updating accommodation" });
  }
});

app.get("/user-places", async (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const { id } = userData;
    res.json(await Accommodation.find({ owner: id }));
  });
});

app.get("/accommodation/:id", async (req, res) => {
  const { id } = req.params;

  res.json(await Accommodation.findById(id));
});

app.get("/accommodation", async (req, res) => {
  res.json(await Accommodation.find());
});
// Routes that require JWT authentication
app.post("/booking/add", verifyToken, (req, res) => {
  const { place, checkIn, checkOut, noofPeople, phoneNo } = req.body;
  
  // Extract userId from the req.user object
  const userId = req.user.userId; // Assuming userId is stored in the JWT payload

  const newBooking = new Booking({
    place,
    checkIn,
    checkOut,
    noofPeople,
    phoneNo,
    userId,
  });

  newBooking
    .save()
    .then(() => {
      res.status(201).json({ message: "Booking Added" });
    })
    .catch((err) => {
      console.error(err);
      res
        .status(500)
        .json({ message: "Failed to add booking", error: err.message });
    });
});

// Update an existing booking
app.put("/booking/update/:bookingId", verifyToken, async (req, res) => {
  try {
    const { place, checkIn, checkOut, noofPeople, phoneNo } = req.body;
    const bookingId = req.params.bookingId;
    
    // Extract userId from the req.user object
    const userId = req.user.userId; // Assuming userId is stored in the JWT payload

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        place,
        checkIn,
        checkOut,
        noofPeople,
        phoneNo,
        userId,
      },
      { new: true } // To return the updated booking
    );

    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    res.status(200).json({ message: "Booking updated successfully.", booking: updatedBooking });
  } catch (error) {
    res.status(500).json({ error: "An error occurred while updating the booking." });
  }
});
// Delete an existing booking
app.delete("/booking/delete/:bookingId", verifyToken, async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    
    // Extract userId from the req.user object
    const userId = req.user.userId; // Assuming userId is stored in the JWT payload

    const deletedBooking = await Booking.findOneAndDelete({
      _id: bookingId,
      userId: userId, // Ensure that the booking belongs to the authenticated user
    });

    if (!deletedBooking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    res.status(200).json({ message: "Booking deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "An error occurred while deleting the booking." });
  }
});
// Retrieve bookings for a specific user
app.get("/booking", verifyToken, async (req, res) => {
  try {
    // Extract userId from the req.user object
    const userId = req.user.userId; // Assuming userId is stored in the JWT payload
    console.log("UserID:", userId); // Log the userId to see if it's correct

    const bookings = await Booking.find({ userId });
    console.log("Bookings:", bookings); // Log the retrieved bookings

    if (!bookings) {
      return res.status(404).json({ message: "No bookings found for this user." });
    }

    res.status(200).json({ bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "An error occurred while fetching bookings." });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
