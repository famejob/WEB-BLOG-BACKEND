import mongoose, { Document } from "mongoose";

interface User extends Document {
    username: string;
    email: string;
    password: string;
    created_at: Date;
    updated_at: Date;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
}

const UserSchema = new mongoose.Schema<User>({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
});


const User = mongoose.model<User>("User", UserSchema);
export default User;
