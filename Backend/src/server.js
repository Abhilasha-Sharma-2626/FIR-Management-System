require('dotenv').config();
const app = require("./app");
const pool=require('./config/db');

const PORT=process.env.PORT || 5000;

const startServer=async()=>{
  try{
    await pool.query("SELECT NOW()");
    console.log("Database connection successful");

    app.listen(PORT,()=>{
      console.log("Server is running : ",PORT);
    })
  }catch(err){
    console.log("Database connection failed : ",err.message);
    process.exit(1);
  }
}

startServer();