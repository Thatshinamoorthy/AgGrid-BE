const mongoose = require('mongoose');

const connectDB = async () => {
    mongoose.connect(process.env.DB_URL,{
        useNewUrlParser:true,
        useUnifiedTopology:true
    }).then((con)=>{
        console.log(con.connection.host);
        console.log("Connected to MongoDB...!");
    }).catch(err=>{
        console.log("MongoDB error:",err);
    })
}

module.exports = connectDB;