const pool=require('../config/db');

function requireRole(allowedRoles=[]){
  return (req,res,next)=>{
    if(!req.user || !allowedRoles.includes(req.user.role)){
      return res.status(403).json({
        success:false,
        message:'Forbidden: You do not have the required role to perform this action.'
      });
    }
    next();
  };
}

function requirePermission(permissionCode){
  return async (req,res,next)=>{
    try{
      if(!req.user){
        return res.status(401).json({
          success:false,
          message:'Unauthorized'
        });
      }

      const checkRes=await pool.query(`SELEECT 1 FROM role_permissions rp JOIN roles r ON rp.role_id=r.role_id JOIN permissions p ON rp.permission_id=p.permission_id WHERE r.code=$1 AND p.code=$2`,[req.user.role,permissionCode]);

      if(checkRes.rows.length===0){
        return res.status(403).json({
          success:false,
          message:`Forbidden: Missing required permission '${permissionCode}'`
        });
      }
      next();
    }catch(err){
      return res.status(500).json({
        success:false,
        message:'Permission verification failed'
      });
    }
  };
}

function requireStationScope(stationIdParamKey='stataionId'){
  return (req,res,next)=>{
    const targetStationId=parseInt(req.params[stationIdParamKey] || req.body[stationIdParamKey],10);

    if(['SUPERVISOR','ADMIN'].includes(req.user.role)){
      return next();
    }

    if(!req.user.stationId || req.user.stationId!==targetStationId){
      return res.status(403).json({
        success:false,
        message:'Forbidden: You do not have jurisdiction in this police station.'
      });
    }
    next();
  };
}

module.exports={requireRole,requirePermission,requireStationScope}