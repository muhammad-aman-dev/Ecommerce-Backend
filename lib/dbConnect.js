import mongoose from "mongoose"

const connectDB =async () => {
  await  mongoose.connect(process.env.MONGO_URI + "/ECommerce" ).then(()=>console.log("DATABASE Connected Successfully")).catch(err=>console.error("Something went wrong can't connect to database!!!",err.message))
}

export default connectDB; 