const express = require("express");
const mongoose = require("mongoose");
const dns = require("dns");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Ensure public/uploads directory exists
const uploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Route files
const placeRoutes = require("./routes/placeRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve uploaded static files
app.use("/uploads", express.static(uploadsDir));

// DNS config
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// Mount routers
app.use("/api/places", placeRoutes);
app.use("/api/auth", authRoutes);
const businessRoutes = require('./routes/businessRoutes');
app.use('/api/business', businessRoutes);
const kumbhRoutes = require('./routes/kumbhRoutes');
app.use('/api/kumbh', kumbhRoutes);
const lostFoundRoutes = require('./routes/lostFoundRoutes');
app.use('/api/kumbh/lost-found', lostFoundRoutes);
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

// Base route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Discover Nashik API" });
});

// Global error handler middleware to ensure JSON response for errors (e.g. 413, 500)
app.use((err, req, res, next) => {
  console.error("Express backend error:", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal server error" });
});

// Database connection & Server start
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });