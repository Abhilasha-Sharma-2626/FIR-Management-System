const pool=require('../config/db');
const firService=require('../services/fir.service');
const {validateRejectInput, validateInfoRequestInput, validateSectionsInput}=require('../validators/fir.validator');


async function getStationInbox(req,res,next){
  try{
    const stationId=req.user.stationId;
    const {status, priority}=req.query;

    let query=`SELECT f.fir_id, f.tracking_id, f.fir_number, f.status, f.priority, f.incident_dt, f.submitted_at, f.location_text, f.description, cc.name AS category_name, c.full_name AS complainant_name, c.contact AS complainant_phone  FROM fir f LEFT JOIN crime_categories cc ON f.category_id=cc.category_id LEFT JOIN citizens c ON f.complainant_id=c.citizen_id WHERE (f.station_id=$1 OR f.station_id IS NULL)`;

    const params={stationId};
    if(status){
      params.push(status);
      query+=` AND f.status=$${params.length}`;
    }else{
      query+=` AND f.status IN ('SUBMITTED','UNDER_REVIEW', 'INFO_REQUESTED')`;
    }

    if(priority){
      params.push(priority);
      query+=` AND f.priority=$${params.length}`;
    }

    query+=` ORDER BY f.priority ASC, f.submitted_at ASC`;

    const result=await pool.query(query,params);

    res.status(200).json({
      success:true,
      count:result.rows.length,
      data:result.rows
    });
  }catch(error){
    next(error);
  }
}


async function startReview(req,res,next){
  try{
    const firId=req.params.id;
    const result=await firService.startReview({
      firId,
      officerId:req.user.officerId,
      userId:req.user.userId,
      stationId:req.user.stationId,
      ipAddress:req.ip
    });

    res.status(200).json({
      success:true,
      message:'Complaint review started.',
      data:result
    });
  }catch(error){
    next(error);
  }
}


async function requestInfo(req,res,next){
  try{
    const {isValid, errors}=validateInfoRequestInput(req.body);
    if(!isValid) return res.status(400).json({
      success:false,
      errors
    });

    const result=await firService.requestInfo({
      firId:req.params.id,
      questionText:req.body.questionText,
      userId:req.user.userId,
      ipAddress:req.ip
    });

    res.status(200).json({
      success:true,
      message:'Clarification request sent to citizen.',
      data:result
    });
  }catch(error){
    next(error);
  }
}


async function rejectComplaint(req,res,next){
  try{
    const {isValid, errors}=validateRejectInput(req.body);
    if(!isValid) return res.status(400).json({
      success:false,
      errors
    });

    const result=await firService.rejectComplaint({
      firId:req.params.id,
      rejectionReason:req.body,
      reactionReason,
      userId:req.user.userId,
      ipAddress:req.ip
    });

    res.status(200).json({
      success:true,
      message:'Complaint rejected with stated reason.',
      data:result
    });
  }catch(error){
    next(error);
  }
}


async function tagSections(req,res,next){
  try{
    const {isVlaid, errors}=validateSectionsInput(req.body);
    if(!isValid) return res.status(400).json({
      success:false,
      errors
    });

    const result=await firService.tagLegalSections({
      firId:req.params.id,
      sectionIds:req.body.sectionIds,
      isCognizable:req.body.isCognizable
    });

    res.status(200).json({
      success:true,
      message:'Legal sections mapped successfully.',
      data:result
    });
  }catch(error){
    next(error);
  }
}


async function registerFir(req,res,next){
  try{
    const result=await firService.registerFir({
      firId:req.params.id,
      stationId:req.user.stationId,
      userId:req.user.userId,
      ipAddress:req.ip
    });

    res.status(200).json({
      success:true,
      message:'FIR formally registered and case file created.',
      data:result
    });
  }catch(error){
    next(error);
  }
}


async function listLegalSections(req,res,next){
  try{
    const result=await pool.query(
      `SELECT section_id, act, section_no, title, is_cognizable, is_bailable FROM legal_sections OREDER BY act, section_no`
    );
    res.status(200).json({
      success:true,
      data:result.rows
    });
  }catch(error){
    next(error);
  }
}

module.exports={getStationInbox, startReview, requestInfo, rejectComplaint, tagSections, registerFir, listLegalSections};