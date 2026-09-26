const express = require("express");
const mongoose = require("mongoose");
const dns = require("dns");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
require("dotenv").config();

// Ensure public/uploads directory exists
const uploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Route files
const placeRoutes = require("./routes/placeRoutes");
const authRoutes = require("./routes/authRoutes");
const businessRoutes = require('./routes/businessRoutes');
const kumbhRoutes = require('./routes/kumbhRoutes');
const lostFoundRoutes = require('./routes/lostFoundRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Security Headers via Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false // CSP disabled on backend API to avoid breaking external resources/proxies
  })
);

// Restricted CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [
      "https://discover-nashik.vercel.app",
      "http://localhost:3000",
      "http://localhost:5000"
    ];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy violation: Origin not allowed"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  })
);

// NoSQL Injection Defense-in-Depth
// NoSQL Injection Defense-in-Depth – sanitize only body and params (query is read‑only in Express 5)
app.use((req, res, next) => {
  // Sanitize req.body if present
  if (req.body && typeof req.body === 'object') {
    req.body = mongoSanitize.sanitize(req.body, { replaceWith: '_' });
  }
  // Sanitize req.params if present
  if (req.params && typeof req.params === 'object') {
    req.params = mongoSanitize.sanitize(req.params, { replaceWith: '_' });
  }
  // Do NOT sanitize req.query – it's a getter in Express 5 and mutating it throws.
  next();
});

// Global Rate Limiter (300 requests per 15 minutes per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests from this IP, please try again later." }
});
app.use("/api/", globalLimiter);

// Body Parsers (Strict 2MB limit for standard JSON/URL-encoded API requests)
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ limit: "2mb", extended: true }));

// Serve uploaded static files safely
app.use("/uploads", express.static(uploadsDir));

// DNS config
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (dnsErr) {
  console.warn("DNS server setup warning:", dnsErr.message);
}

// Mount routers
app.use("/api/places", placeRoutes);
app.use("/api/auth", authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/kumbh', kumbhRoutes);
app.use('/api/kumbh/lost-found', lostFoundRoutes);
app.use('/api/admin', adminRoutes);

// Base route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Discover Nashik API" });
});

// Global error handler middleware — generic safe messages in production
app.use((err, req, res, next) => {
  console.error("Express backend error:", err);
  const status = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === "production";
  const safeMessage = isProd && status === 500 
    ? "Internal server error" 
    : (err.message || "An error occurred");
  res.status(status).json({ message: safeMessage });
});

// Database connection & Server start
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);

      // Run Kumbh seed asynchronously after server starts listening
      const { seedDefaultDataIfEmpty } = require('./controllers/kumbhController');
      seedDefaultDataIfEmpty()
        .then(() => {
          console.log('Kumbh default data seeding completed at startup');
        })
        .catch((seedErr) => {
          console.warn('Kumbh default data seeding failed:', seedErr.message);
        });
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });