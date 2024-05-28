import mongoose, { Document } from "mongoose";

interface Blog extends Document {
    title: string;
    content: string;
    author: mongoose.Types.ObjectId;
    created_at: Date;
    updated_at: Date;
}

const blogSchema = new mongoose.Schema<Blog>({
    title: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const Blog = mongoose.model<Blog>("Blog", blogSchema);
export default Blog;


