import express, {Express, Request, response, Response, NextFunction} from 'express';
import dotenv from 'dotenv';
import * as fs from "fs";
import axios, {AxiosInterceptorManager, AxiosRequestConfig, AxiosResponse} from "axios";
import Service from './service';

const app: Express = express();
const port = process.env.PORT;

dotenv.config();

const verifyApiKey = (req: Request, res: Response, next: NextFunction) => {
    let apiKey = req.header("x-api-key");
    if (apiKey === process.env.API_KEY) {
        next();
    } else {
        res.status(403).send();
    }
}

const service = new Service()

// Request logging
app.use((req, res, next) => {
    console.info(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`)
    res.on('finish', () => {
        console.info(`${new Date().toISOString()} ${res.statusCode} ${res.statusMessage}; ${res.get('Content-Length') || 0}b sent`)
    })

    next()
})

// Get all "fast and furious" movies
app.get('/films', verifyApiKey, (req: Request, res: Response) => {
    service.getFafMovies()
        .then(movies => res.send(movies));
});

// Get all "Pirates of the caribeans" movies and save it on a google spreadsheet
app.get('/spreadsheet', verifyApiKey, (req: Request, res: Response) => {
    service.getPdcMovies()
        .then(pdcMovies => {
            res.send(pdcMovies)
            service.saveToSpreadsheet(pdcMovies);
        })
});

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

