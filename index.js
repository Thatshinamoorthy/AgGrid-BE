const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const db = require('./Config/dataBase.js');

app.use(cors());
app.use(express.json({limit:"2mb"}));
app.use(express.urlencoded({limit:"10mb",extended:true}));

const users = require("./Routes/userRoutes.js")
app.use("/api",users);

db();
app.listen(process.env.PORT||5000,()=>{
    console.log("Server is Running..!");
});