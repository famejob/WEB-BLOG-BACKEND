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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const users_1 = __importDefault(require("../models/users"));
const dotenv_1 = __importDefault(require("dotenv"));
const crypto_1 = __importDefault(require("crypto"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const auth_1 = __importDefault(require("../middlewares/auth"));
const blogs_1 = __importDefault(require("../models/blogs"));
dotenv_1.default.config();
const router = express_1.default.Router();
router.post('/register', [
    (0, express_validator_1.body)('username')
        .custom((value) => __awaiter(void 0, void 0, void 0, function* () {
        const existingUser = yield users_1.default.findOne({ username: value });
        if (existingUser) {
            return Promise.reject('ชื่อผู้ใช้นี้มีผู้ใช้งานแล้ว');
        }
    }))
        .isString().withMessage('ชื่อผู้ใช้งานต้องเป็นข้อมูลชนิดสตริง')
        .notEmpty().withMessage('กรุณากรอกชื่อผู้ใช้งาน'),
    (0, express_validator_1.body)('email')
        .custom((value) => __awaiter(void 0, void 0, void 0, function* () {
        const existingEmail = yield users_1.default.findOne({ email: value });
        if (existingEmail) {
            return Promise.reject('อีเมลนี้มีผู้ใช้งานแล้ว');
        }
    }))
        .isEmail().withMessage('รูปแบบอีเมลไม่ถูกต้อง')
        .notEmpty().withMessage('กรุณากรอกอีเมล'),
    (0, express_validator_1.body)('password')
        .isString().withMessage('รหัสผ่านต้องเป็นข้อมูลชนิดสตริง')
        .isLength({ min: 8 }).withMessage('กรุณากรอกรหัสผ่านความยาวไม่ต่ำกว่า 8 ตัวอักษร')
        .notEmpty().withMessage('กรุณากรอกรหัสผ่าน')
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).send({ errors: errors.array() });
    }
    try {
        const { username, email, password } = req.body;
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = new users_1.default({ username, email, password: hashedPassword });
        yield user.save();
        res.status(201).send({ user, message: 'สมัครเป็นนักเขียนสำเร็จแล้ว !' });
    }
    catch (error) {
        res.status(500).send({ error: error.message });
    }
}));
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email && !password) {
            return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });
        }
        if (!email) {
            return res.status(400).json({ error: 'กรุณากรอกอีเมล' });
        }
        if (!password) {
            return res.status(400).json({ error: 'กรุณากรอกรหัสผ่าน' });
        }
        const user = yield users_1.default.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in the environment variables');
        }
        const jwtSecret = process.env.JWT_SECRET;
        const token = jsonwebtoken_1.default.sign({ _id: user._id }, jwtSecret, { expiresIn: '15d' });
        res.send({
            token,
            user_info: {
                id: user._id,
                username: user.username,
                email: user.email
            }, message: 'เข้าสู่ระบบสำเร็จ'
        });
    }
    catch (error) {
        res.status(500).send({ error: error.message });
    }
}));
router.post('/forgot-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const user = yield users_1.default.findOne({ email });
        if (!user) {
            return res.status(400).send({ message: 'ไม่พบผู้ใช้งานนี้' });
        }
        const token = crypto_1.default.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
        yield user.save();
        if (!process.env.EMAIL) {
            throw new Error('EMAIL is not defined in the environment variables');
        }
        const email_user = process.env.EMAIL;
        if (!process.env.APP_PASSWORD) {
            throw new Error('APP_PASSWORD is not defined in the environment variables');
        }
        const app_password = process.env.APP_PASSWORD;
        const transporter = nodemailer_1.default.createTransport({
            service: 'Gmail',
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: email_user,
                pass: app_password,
            },
        });
        if (!process.env.FRONTEND_URL) {
            throw new Error("FRONTEND_URL is not defined");
        }
        const frontend_url = process.env.FRONTEND_URL;
        const mailOptions = {
            to: user.email,
            from: email_user,
            subject: 'เปลี่ยนรหัสผ่าน',
            text: `คุณได้รับอีเมลนี้เนื่องจากคุณ (หรือบุคคลอื่น) ได้ร้องขอให้เปลี่ยนรหัสผ่านสําหรับบัญชีของคุณ\n\n
                   โปรดคลิกที่ลิงค์ต่อไปนี้หรือวางลงในเบราว์เซอร์ของคุณเพื่อเสร็จสิ้นกระบวนการ:\n\n
                   ${frontend_url}/reset/${token}\n\n
                   หากคุณไม่ได้ร้องขอสิ่งนี้โปรดเพิกเฉยต่ออีเมลนี้และรหัสผ่านของคุณจะยังคงไม่เปลี่ยนแปลง\n`,
        };
        yield transporter.sendMail(mailOptions);
        res.send({ message: 'ส่งอีเมลสำหรับการเปลี่ยนรหัสผ่านแล้ว' });
    }
    catch (error) {
        res.status(500).send({ error: error.message });
    }
}));
router.post('/reset/:token', [(0, express_validator_1.body)('password')
        .isString().withMessage('รหัสผ่านต้องเป็นข้อมูลชนิดสตริง')
        .isLength({ min: 8 }).withMessage('กรุณากรอกรหัสผ่านความยาวไม่ต่ำกว่า 8 ตัวอักษร')
        .notEmpty().withMessage('กรุณากรอกรหัสผ่าน')
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).send({ errors: errors.array() });
    }
    try {
        const { token } = req.params;
        const { password } = req.body;
        const user = yield users_1.default.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
        if (!user) {
            return res.status(400).send({ message: 'โทเค็นสำหรับเปลี่ยนรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว' });
        }
        user.password = yield bcryptjs_1.default.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        yield user.save();
        res.send({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    }
    catch (error) {
        res.status(500).send({ error: error.message });
    }
}));
router.delete('/delete-account', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield users_1.default.findById(req.userId);
        const blogs = yield blogs_1.default.find({
            author: req.userId,
        });
        if (!user || user._id != req.userId) {
            return res.status(401).send({ message: 'ผู้ใช้งานไม่ได้รับอนุญาตให้ลบบัญชีผู้ใช้งาน' });
        }
        if (blogs.some(blog => blog.author.toString() !== req.userId)) {
            return res.status(401).send({ message: 'ผู้ใช้งานไม่ได้รับอนุญาตให้ลบบทความ' });
        }
        yield blogs_1.default.deleteMany({ author: req.userId });
        yield users_1.default.findByIdAndDelete(req.userId);
        res.send({ message: 'ลบบัญชีผู้ใช้งานเรียบร้อยแล้ว' });
    }
    catch (error) {
        res.status(500).send({ error: error.message });
    }
}));
exports.default = router;
