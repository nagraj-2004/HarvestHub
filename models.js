import mongoose from "mongoose";
const userSchema=new mongoose.Schema({
    gstin: String,
    username: String,
     email: { type: String, unique: true }, // ✅ unique email
    password: String
   
});
export default mongoose.model('User', userSchema);

