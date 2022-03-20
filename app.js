// const helmet = require("helmet");
// const config = require("config");
const express = require("express");
// const Joi = require("joi");
// const logger = require("./logger");

const paymentRoutes = require('./routes/payment');
const app = express();
app.use(express.json());
app.use('/',paymentRoutes);
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
