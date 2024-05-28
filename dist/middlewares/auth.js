"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const auth = (req, res, next) => {
    var _a;
    const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
    if (!token) {
        return res.status(401).send({ message: 'ไม่มีโทเค็น การเข้าถึงถูกปฏิเสธ' });
    }
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in the environment variables');
    }
    const jwtSecret = process.env.JWT_SECRET;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.userId = decoded._id;
        next();
    }
    catch (error) {
        res.status(401).send({ message: 'โทเค็นไม่ถูกต้อง' });
    }
};
exports.default = auth;
