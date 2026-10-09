const authService=require('../services/auth.service');
const {validateRegisterInput,validateLoginInput}=require('../validators/auth.validator');

async function register(req,res){
  try{
    const validation=validateRegisterInput(req.body);
    if(!validation.isValid){
      return res.status(400).json({
        success:false,
        errors:validation.errors
      });
    }

    const result=await authService.registerCitizen(req.body);
    return res.status(201).json({
      success:true,
      message:'Citizen registerd successfully',
      data:result
    });
  }catch(error){
    return res.status(error.statusCode || 500).json({
      success:false,
      message:error.message || 'Server error during registration'
    });
  }
}

async function login(req,res){
  try{
    const validation=validateLoginInput(req.body);
    if(!validation.isValid){
      return res.status(400).json({
        success:false,
        errors:validation.errors
      });
    }

    const ipAddress=req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const result=await authService.loginUser({
      email:req.body.email,
      password:req.body.password,
      ipAddress
    });

    return res.status(200).json({
      success:true,
      message:'Login successful',
      data:result
    });
  }catch(error){
    return res.status(error.statusCode || 500).json({
      success:false,
      message:error.message || 'Server error during login'
    });
  }
}

async function getMe(req,res){
  try{
    return res.status(200).json({
      success:true,
      data:req.user
    });
  }catch(error){
    return res.status(500).json({
      success:false,
      message:'Error fetching current user profile.'
    });
  }
}

module.exports={register,login,getMe}
