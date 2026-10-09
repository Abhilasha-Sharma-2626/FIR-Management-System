const {verifyToken}=require('../utils/auth.util');

function authenticate(req,res,next){
  const authHeader=req.headers.authorization;
  if(!authHeader || !authHeader.startsWith('Bearer')){
    return res.status(401).json({
      success:false,
      message:'Access denied. No token provided.'
    });
  }

  const token=authHeader.split(' ')[1];
  try{
    const decoded=verifyToken(token);
    req.user=decoded;
    next();
  }catch(err){
    return res.status(401).json({
      success:false,
      message:'Invalid or expired token.'
    });
  }
}  

module.exports={authenticate};