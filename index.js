const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB
connectDB();

// Routes (we'll wire these up as we build them)
app.use("/api/campaigns", require("./routes/campaignRoutes"));
app.use("/api/contributions", require("./routes/contributionRoutes"));
app.use("/api/withdrawals", require("./routes/withdrawalRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
// app.use("/api/notifications", require("./routes/notificationRoutes"));
// app.use("/api/payments", require("./routes/paymentRoutes"));

app.get("/", (req, res) => {
  res.send("Crowdfunding Platform API is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
