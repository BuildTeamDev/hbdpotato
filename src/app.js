const express = require("express");
var cors = require("cors");
const jobsRouter = require("./routes/jobs");

// Express
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: false}));

//CORS
app.use(cors());

// Routes
app.use(jobsRouter);
module.exports = app;
