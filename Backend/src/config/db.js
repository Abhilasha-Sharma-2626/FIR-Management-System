const {Pool}=require('pg');

const pool=new Pool({
  connectionString:process.env.POSTGRES_URI,
});

pool.on("error",(err)=>{
  console.error("Unexpected PostgreSQL error : ",err);
});

module.exports=pool