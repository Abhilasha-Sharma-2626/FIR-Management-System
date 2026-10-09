function validateRegisterInput(data){
  const errors=[];

  if(!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)){
    errors.push('A valid email is required. ');
  }
  if(!data.password || data.password.length<8){
    errors.push('Password must be at least 8 characters');
  }

  if(!data.fullName || data.fullName.trim().length===0){
    errors.push('Full name is required');
  }
  if(data.phone && !/^\+?[0-9]{10,15}$/.test(data.phone)){
    errors.push('A valid phone number is required');
  }
  if(data.idProofLast4 && !/^[0-9]{4}$/.test(data.idProofLast4)){
    errors.push('idProofLast4 must be 4 digits');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateLoginInput(data){
  const errors = [];
  if(!data.email || !data.email.trim()){
    errors.push('Email is required.');
  }
  if(!data.password){
    errors.push('Password is required');
  }
  return{
    isValid:errors.length === 0,
    errors
  };
}

module.exports = {
  validateRegisterInput,
  validateLoginInput
};