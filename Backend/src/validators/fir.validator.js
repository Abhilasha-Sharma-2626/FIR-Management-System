function validateRejectInput(data){
  const errors=[];
  if(!data.rejectionReason || data.rejectionReason.trim().length<10){
    errors.push('Rejection reason must be at least 10 characters long.');
  }
  return {isValid:errors.length===0, errors};
}


function validateInfoRequestInput(data){
  const errors=[];
  if(!data.questionText || data.questionText.trim().length<5){
    errors.push('Question or clarification text must be at least 5 characters long.');
  }
  return {isValid:errors.length===0, errors};
}


function validateSectionsInput(data){
  const errors=[];
  if(!Array.isArray(data.sectionIds) || data.sectionIds.length===0){
    errors.push('At least one section ID must be provided in sectionIds array.');
  }
  return {isValid:errors.length===0, errors};
}

module.exports={validateRejectInput, validateInfoRequestInput, validateSectionsInput};