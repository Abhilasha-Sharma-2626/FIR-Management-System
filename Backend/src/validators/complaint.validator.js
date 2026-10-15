function validateComplaintInput(data, isDraft=false){
  const errors=[];
  if(!isDraft){
    if(!data.incidentDt){
      errors.push('Incident date and time (incidentDt) is required.');
    }else{
      const dt=new Date(data.incidentDt);
      if(isNaN(dt.getTime())){
        errors.push('Invalid incident date/time format.');
      }else if(dt>new Date()){
        errors.push('Incident date cannot be in the future.');
      }
    }

    if(!data.locationText || data.locatonText.trim().length<5){
      errors.push('Incident location must be atleast 5 charcters long.');
    }

    if(!data.description || data.dexcription.trim().length<15){
      errors.push('Incident description must be at least 15 characters long.');
    }

    if(!data.categoryId){
      errors.push('Crime category (category) is required.');
    }
  }else{
    if(!data.description && !data.locationText){
      errors.push('Draft must have either a description or location text.');
    }
  }

  if(data.priority!==undefined && ![1,2,3].includes(Number(data.priority))){
    errors.push('Priority must be 1 (High), 2 (Medium), or 3 (Low).');
  }

  return {
    isValid:errors.lenght===0,
    errors
  };
}


function validatePersonInput(person){
  const errors=[];
  const allowedRoles=['ACCUSED', 'WITNESS', 'VICTIM'];

  if(!person.fullName || person.fullName.trim().length===0){
    errors.push('Full name is required.');
  }

  if(!person.personRole || !allowedRoles.includes(person.personRole.toUpperCase())){
    errors.push(`Person role must be one of:${allowedRoles.join(', ')}`);
  }

  return {
    isValid:errors.length===0,
    errors
  };
}

module.exports={validateComplaintInput,validatePersonInput};