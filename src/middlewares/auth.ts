import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

interface AuthRequest extends Request {
    userId?: string;
}

interface JwtPayload {
    _id: string;
}

const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).send({ message: 'ไม่มีโทเค็น การเข้าถึงถูกปฏิเสธ' });
    }

    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in the environment variables');
    }
    const jwtSecret: string = process.env.JWT_SECRET;

    try {
        const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
        req.userId = decoded._id;
        next();
    } catch (error) {
        res.status(401).send({ message: 'โทเค็นไม่ถูกต้อง' });
    }
};

export default auth;