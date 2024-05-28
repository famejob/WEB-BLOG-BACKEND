"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const blogController_1 = __importDefault(require("./controllers/blogController"));
const authController_1 = __importDefault(require("./controllers/authController"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '100mb' }));
app.use(express_1.default.urlencoded({ limit: '100mb', extended: true }));
const port = parseInt(process.env.PORT || '3000', 10);
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in the environment variables');
}
const connect = process.env.DATABASE_URL;
mongoose_1.default.connect(connect)
    .then(() => {
    console.log('Connected to MongoDB');
})
    .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});
app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.use(blogController_1.default);
app.use(authController_1.default);
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
