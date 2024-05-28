import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import blogs from './controllers/blogController'
import auth from './controllers/authController'
dotenv.config();
const app = express()
app.use(cors())
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
const port: number = parseInt(process.env.PORT || '3000', 10);
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in the environment variables');
}

const connect: string = process.env.DATABASE_URL
mongoose.connect(connect)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });

app.get('/', (req: express.Request, res: express.Response) => {
    res.send('Hello World!')
})

app.use(blogs);
app.use(auth);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})
