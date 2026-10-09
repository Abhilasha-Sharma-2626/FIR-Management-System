const express=require('express');
const cors=require('cors');
const authRoutes=require('./routes/auth.route');

const app=express();

app.use(cors());
app.use(express.json());

app.use('/api/auth',authRoutes);

app.get("/api/test",(req,res)=>{
  res.status(200).json({
    message:"Server is running on port 5000"
  })
})

module.exports=app;