const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const swaggerUi = require("swagger-ui-express");
const openapiSpec = require("./config/openapi.json");
const authRoutes = require("./routes/auth.routes");
const transactionRoutes = require("./routes/transaction.routes");
const adminRoutes = require("./routes/admin.routes");
const ruleRoutes = require("./routes/rule.routes");
const vpaRoutes = require("./routes/vpa.routes");
const caseRoutes = require("./routes/case.routes");
const scannerRoutes = require("./routes/scanner.routes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "risklens-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/rules", ruleRoutes);
app.use("/api/vpa", vpaRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/scanner", scannerRoutes);

app.listen(PORT, () => {
  console.log("SentinelPay backend listening on port " + PORT);
});