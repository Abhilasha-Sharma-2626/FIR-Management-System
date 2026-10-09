const express=require('express');
const cors=require('cors');


const app=express();

app.use(cors());
app.use(express.json());

app.get("/api/test",(req,res)=>{
  res.status(200).json({
    message:"Server is running on port 5000"
  })
})

module.exports=app;