import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Blog from '../models/blogs';
import User from '../models/users';
import auth from '../middlewares/auth';

interface AuthRequest extends Request {
    userId?: string;
}

const router = express.Router();

router.get('/blogs', async (req: Request, res: Response) => {
    try {
        const blogs = await Blog.find().populate('author', 'username');
        res.send(blogs);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/my-blogs', auth, async (req: AuthRequest, res: Response) => {
    try {
        const blogs = await Blog.find({ author: req.userId }).populate('author', 'username');
        res.send(blogs);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/blogs/:id', async (req: Request, res: Response) => {
    try {
        const blog = await Blog.findById(req.params.id).populate('author', 'username email');
        if (!blog) {
            return res.status(404).send({ message: 'ไม่พบบทความ' });
        }
        res.json(blog);
    } catch (error) {
        res.status(500).send({ error: (error as Error).message });
    }
});

router.get('/search/:query', async (req: Request, res: Response) => {
    try {
        const query = req.params.query;
        const users = await User.find({ username: { $regex: query, $options: 'i' } }).select('_id');
        const userIds = users.map(user => user._id);
        const blogs = await Blog.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { author: { $in: userIds } }
            ]
        }).populate('author', 'username email');
        res.send(blogs);
    } catch (error) {
        res.status(500).send({ error: (error as Error).message });
    }
});


router.get('/my-blogs/search/:query', auth, async (req: AuthRequest, res: Response) => {
    try {
        const query = req.params.query;
        const blogs = await Blog.find({
            author: req.userId,
            title: { $regex: query, $options: 'i' }
        }).populate('author', 'username');
        res.send(blogs);
    } catch (error) {
        res.status(500).send({ error: (error as Error).message });
    }
});

router.post('/blogs', auth,
    [
        body('title')
            .custom(async (value) => {
                const existingBlog = await Blog.findOne({ title: value });
                if (existingBlog) {
                    return Promise.reject('บทความนี้มีอยู่ในระบบแล้ว');
                }
            })
            .isString().withMessage('ชื่อบทความต้องเป็นข้อมูลชนิดสตริง')
            .notEmpty().withMessage('กรุณากรอกชื่อบทความ'),
        body('content')
            .isString().withMessage('เนื้อหาบทความต้องเป็นข้อมูลชนิดสตริง')
            .notEmpty().withMessage('กรุณากรอกเนื้อหาบทความ')
    ], async (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send({ errors: errors.array() });
        }

        try {
            const { title, content } = req.body;
            const blog = new Blog({ title, content, author: req.userId });
            await blog.save();
            res.status(201).send({ blog, message: 'เพิ่มบทความเรียบร้อยแล้ว !' });
        } catch (error) {
            res.status(500).send({ error: (error as Error).message });
        }
    }
);

router.put('/blogs/:id', auth,
    [
        body('title')
            .optional()
            .custom(async (value, { req }) => {
                const id = req.params?.id;
                const existingBlog = await Blog.findOne({ title: value, _id: { $ne: id } });
                if (existingBlog) {
                    return Promise.reject('บทความนี้มีอยู่ในระบบแล้ว');
                }
            })
            .isString().withMessage('ชื่อบทความต้องเป็นข้อมูลชนิดสตริง')
            .notEmpty().withMessage('กรุณากรอกชื่อบทความ'),
        body('content')
            .optional()
            .isString().withMessage('เนื้อหาบทความต้องเป็นข้อมูลชนิดสตริง')
            .notEmpty().withMessage('กรุณากรอกเนื้อหาบทความ')
    ], async (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send({ errors: errors.array() });
        }

        try {
            const { title, content } = req.body;
            const blog = await Blog.findById(req.params.id);
            if (!blog) {
                return res.status(404).send({ message: 'ไม่พบบทความ' });
            }

            if (blog.author.toString() !== req.userId) {
                return res.status(401).send({ message: 'ผู้ใช้ไม่ได้รับอนุญาตให้แก้ไขบทความ' });
            }

            if (title) blog.title = title;
            if (content) blog.content = content;
            blog.updated_at = new Date();

            await blog.save();
            res.send({ blog, message: 'อัพเดตบทความเรียบร้อยแล้ว !' });
        } catch (error) {
            res.status(500).send({ error: (error as Error).message });
        }
    }
);

router.delete('/blogs/:id', auth, async (req: AuthRequest, res: Response) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).send({ message: 'ไม่พบบทความ' });
        }

        if (blog.author.toString() !== req.userId) {
            return res.status(401).send({ message: 'ผู้ใช้งานไม่ได้รับอนุญาตให้ลบบทความ' });
        }

        await Blog.deleteOne({ _id: req.params.id });
        res.send({ message: 'ลบบทความเรียบร้อย' });
    } catch (error) {
        res.status(500).send({ error: (error as Error).message });
    }
});

export default router;