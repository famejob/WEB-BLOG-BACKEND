"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const blogSchema = new mongoose_1.default.Schema({
    title: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    author: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});
const Blog = mongoose_1.default.model("Blog", blogSchema);
exports.default = Blog;
