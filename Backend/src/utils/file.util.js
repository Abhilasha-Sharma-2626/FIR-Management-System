const crypto=require('crypto');
const fs=require('fs');

function computeFileSha256(filePath){
  return new Promise((resolve, reject)=>{
    const hash=crypto.createHash('sha256');
    const stream=fs.createReadStream(filePath);

    stream.on('data', data=>hash.update(data));
    stream.on('end',()=>resolve(hash.digest('hex')));
    stream.on('error',err=>reject(err));
  });
}

function computeBufferSha256(buffer){
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

module.exports={computeFileSha256,computeBufferSha256};