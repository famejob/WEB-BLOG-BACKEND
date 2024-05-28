"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const blogs_1 = __importDefault(require("../models/blogs"));
const users_1 = __importDefault(require("../models/users"));
const auth_1 = __importDefault(require("../middlewares/auth"));
const router = express_1.default.Router();
router.get('/blogs', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const blogs = yield blogs_1.default.find().populate('author', 'username');
        res.send(blogs);
    }
    catch (error) {
        res.status(500).send(error);
    }
}));
router.get('/my-blogs', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const blogs = yield blogs_1.default.find({ author: req.userId }).populate('author', 'username');
        res.send(blogs);
    }
    catch (error) {
        res.status(500).send(error);
    }
}));
router.get('/blogs/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const blog = yield blogs_1.default.findById(req.params.id).populate('author', 'username email');
        if (!blog) {
            return res.status(404).send({ message: 'ไม่พบบทความ' });
        }
        res.json(blog);
    }
    catch (error) {
        res.status(500).send({ error: error.message });
    }
}));
router.get('/search/:query', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = req.params.query;
        const users = yield users_1.default.find({ username: { $regex: query, $options: 'i' } }).select('_id');
        const userIds = users.map(user => user._id);
        const blogs = yield blogs_1.default.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { author: { $in: userIds } }
            ]
        }).populate('author', 'username email');
        res.send(blogs);
    }
    catch (error) {
        res.status(500).send({ error: error.message });
    }
}));
router.get('/my-blogs/search/:query', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = req.params.query;
        const blogs = yield blogs_1.default.find({
            author: req.userId,
            title: { $regex: query, $options: 'i' }
        }).populate('author', 'username');
        res.send(blogs);
    }
    catch (error) {
        res.status(500).send({ error: error.message });
    }
}));
router.post('/blogs', auth_1.default, [
    (0, express_validator_1.body)('title')
        .custom((value) => __awaiter(void 0, void 0, void 0, function* () {
        const existingBlog = yield blogs_1.default.findOne({ title: value });
        if (existingBlog) {
            return Promise.reject('บทความนี้มีอยู่ในระบบแล้ว');
        }
    }))
        .isString().withMessage('ชื่อบทความต้องเป็นข้อมูลชนิดสตริง')
        .notEmpty().withMessage('กรุณากรอกชื่อบทความ'),
    (0, express_validator_1.body)('content')
        .isString().withMessage('เนื้อหาบทความต้องเป็นข้อมูลชนิดสตริง')
        .notEmpty().withMessage('กรุณากรอกเนื้อหาบทความ')
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).send({ errors: errors.array() });
    }
    try {
        const { title, content } = req.body;
        const blog = new blogs_1.default({ title, content, author: req.userId });
        yield blog.save();
        res.status(201).send({ blog, message: 'เพิ่มบทความเรียบร้อยแล้ว !' });
    }
    catch (error) {
        res.status(500).send({ error: error.message });
    }
}));
router.put('/blogs/:id', auth_1.default, [
    (0, express_validator_1.body)('title')
        .optional()
        .custom((value_1, _a) => __awaiter(void 0, [value_1, _a], void 0, function* (value, { req }) {
        var _b;
        const id = (_b = req.params) === null || _b === void 0 ? void 0 : _b.id;
        const existingBlog = yield blogs_1.default.findOne({ title: value, _id: { $ne: id } });
        if (existingBlog) {
            return Promise.reject('บทความนี้มีอยู่ในระบบแล้ว');
        }
    }))
        .isString().withMessage('ชื่อบทความต้องเป็นข้อมูลชนิดสตริง')
        .notEmpty().withMessage('กรุณากรอกชื่อบทความ'),
    (0, express_validator_1.body)('content')
        .optional()
        .isString().withMessage('เนื้อหาบทความต้องเป็นข้อมูลชนิดสตริง')
        .notEmpty().withMessage('กรุณากรอกเนื้อหาบทความ')
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).send({ errors: errors.array() });
    }
    try {
        const { title, content } = req.body;
        const blog = yield blogs_1.default.findById(req.params.id);
        if (!blog) {
            return res.status(404).send({ message: 'ไม่พบบทความ' });
        }
        if (blog.author.toString() !== req.userId) {
            return res.status(401).send({ message: 'ผู้ใช้ไม่ได้รับอนุญาตให้แก้ไขบทความ' });
        }
        if (title)
            blog.title = title;
        if (content)
            blog.content = content;
        blog.updated_at = new Date();
        yield blog.save();
        res.send({ blog, message: 'อัพเดตบทความเรียบร้อยแล้ว !' });
    }
    catch (error) {
        res.status(500).send({ error: error.message });
    }
}));
router.delete('/blogs/:id', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const blog = yield blogs_1.default.findById(req.params.id);
        if (!blog) {
            return res.status(404).send({ message: 'ไม่พบบทความ' });
        }
        if (blog.author.toString() !== req.userId) {
            return res.status(401).send({ message: 'ผู้ใช้งานไม่ได้รับอนุญาตให้ลบบทความ' });
        }
        yield blogs_1.default.deleteOne({ _id: req.params.id });
        res.send({ message: 'ลบบทความเรียบร้อย' });
    }
    catch (error) {
        res.status(500).send({ error: error.message });
    }
}));
exports.default = router;
