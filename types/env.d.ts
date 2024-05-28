declare namespace NodeJS {
    interface ProcessEnv {
        PORT?: string;
        DATABASE_URL: string;
        JWT_SECRET: string;
        EMAIL: string;
        APP_PASSWORD: string;
        FRONTEND_URL: string;
    }
}