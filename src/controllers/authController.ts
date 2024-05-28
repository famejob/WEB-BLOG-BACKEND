import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/users';
import dotenv from 'dotenv';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import auth from '../middlewares/auth';
import Blog from '../models/blogs';

interface AuthRequest extends Request {
    userId?: string;
}

dotenv.config();

const router = express.Router();

router.post('/register',
    [
        body('username')
            .custom(async (value) => {
                const existingUser = await User.findOne({ username: value });
                if (existingUser) {
                    return Promise.reject('ชื่อผู้ใช้นี้มีผู้ใช้งานแล้ว');
                }
            })
            .isString().withMessage('ชื่อผู้ใช้งานต้องเป็นข้อมูลชนิดสตริง')
            .notEmpty().withMessage('กรุณากรอกชื่อผู้ใช้งาน'),
        body('email')
            .custom(async (value) => {
                const existingEmail = await User.findOne({ email: value });
                if (existingEmail) {
                    return Promise.reject('อีเมลนี้มีผู้ใช้งานแล้ว');
                }
            })
            .isEmail().withMessage('รูปแบบอีเมลไม่ถูกต้อง')
            .notEmpty().withMessage('กรุณากรอกอีเมล'),
        body('password')
            .isString().withMessage('รหัสผ่านต้องเป็นข้อมูลชนิดสตริง')
            .isLength({ min: 8 }).withMessage('กรุณากรอกรหัสผ่านความยาวไม่ต่ำกว่า 8 ตัวอักษร')
            .notEmpty().withMessage('กรุณากรอกรหัสผ่าน')
    ], async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send({ errors: errors.array() });
        }

        try {
            const { username, email, password } = req.body;
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = new User({ username, email, password: hashedPassword });
            await user.save();
            res.status(201).send({ user, message: 'สมัครเป็นนักเขียนสำเร็จแล้ว !' });
        } catch (error) {
            res.status(500).send({ error: (error as Error).message });
        }
    });

router.post('/login', async (req: Request, res: Response) => {
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

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in the environment variables');
        }
        const jwtSecret: string = process.env.JWT_SECRET;
        const token = jwt.sign({ _id: user._id }, jwtSecret, { expiresIn: '15d' });
        res.send({
            token,
            user_info: {
                id: user._id,
                username: user.username,
                email: user.email
            }, message: 'เข้าสู่ระบบสำเร็จ'
        });
    } catch (error) {
        res.status(500).send({ error: (error as Error).message });
    }
});

router.post('/forgot-password', async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).send({ message: 'ไม่พบผู้ใช้งานนี้' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

        await user.save();

        if (!process.env.EMAIL) {
            throw new Error('EMAIL is not defined in the environment variables');
        }
        const email_user: string = process.env.EMAIL;

        if (!process.env.APP_PASSWORD) {
            throw new Error('APP_PASSWORD is not defined in the environment variables');
        }
        const app_password: string = process.env.APP_PASSWORD;

        const transporter = nodemailer.createTransport({
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
        const frontend_url: string = process.env.FRONTEND_URL;

        const mailOptions = {
            to: user.email,
            from: email_user,
            subject: 'เปลี่ยนรหัสผ่าน',
            text: `คุณได้รับอีเมลนี้เนื่องจากคุณ (หรือบุคคลอื่น) ได้ร้องขอให้เปลี่ยนรหัสผ่านสําหรับบัญชีของคุณ\n\n
                   โปรดคลิกที่ลิงค์ต่อไปนี้หรือวางลงในเบราว์เซอร์ของคุณเพื่อเสร็จสิ้นกระบวนการ:\n\n
                   ${frontend_url}/reset/${token}\n\n
                   หากคุณไม่ได้ร้องขอสิ่งนี้โปรดเพิกเฉยต่ออีเมลนี้และรหัสผ่านของคุณจะยังคงไม่เปลี่ยนแปลง\n`,
        };

        await transporter.sendMail(mailOptions);

        res.send({ message: 'ส่งอีเมลสำหรับการเปลี่ยนรหัสผ่านแล้ว' });
    } catch (error) {
        res.status(500).send({ error: (error as Error).message });
    }
});

router.post('/reset/:token',
    [body('password')
        .isString().withMessage('รหัสผ่านต้องเป็นข้อมูลชนิดสตริง')
        .isLength({ min: 8 }).withMessage('กรุณากรอกรหัสผ่านความยาวไม่ต่ำกว่า 8 ตัวอักษร')
        .notEmpty().withMessage('กรุณากรอกรหัสผ่าน')
    ], async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send({ errors: errors.array() });
        }
        try {
            const { token } = req.params;
            const { password } = req.body;

            const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });

            if (!user) {
                return res.status(400).send({ message: 'โทเค็นสำหรับเปลี่ยนรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว' });
            }

            user.password = await bcrypt.hash(password, 10);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            await user.save();

            res.send({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
        } catch (error) {
            res.status(500).send({ error: (error as Error).message });
        }
    });

router.delete('/delete-account', auth, async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.userId);
        const blogs = await Blog.find({
            author: req.userId,
        })

        if (!user || user._id != req.userId) {
            return res.status(401).send({ message: 'ผู้ใช้งานไม่ได้รับอนุญาตให้ลบบัญชีผู้ใช้งาน' });
        }
        if (blogs.some(blog => blog.author.toString() !== req.userId)) {
            return res.status(401).send({ message: 'ผู้ใช้งานไม่ได้รับอนุญาตให้ลบบทความ' });
        }

        await Blog.deleteMany({ author: req.userId });

        await User.findByIdAndDelete(req.userId);

        res.send({ message: 'ลบบัญชีผู้ใช้งานเรียบร้อยแล้ว' });
    } catch (error) {
        res.status(500).send({ error: (error as Error).message });
    }
});

export default router;