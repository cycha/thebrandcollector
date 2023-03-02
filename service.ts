import axios from "axios";
import * as fs from "fs";
import dotenv from 'dotenv';
import {GoogleSpreadsheet} from 'google-spreadsheet';

dotenv.config();
const omdbApiKey = process.env.OMDB_API_KEY;
const swPath = "movies_sw.json";
const pdcPath = "movies_pdc.json";
const fafPath = "movies_faf.json";

export default class Service {
    fafMovies?: any[];
    pdcMovies?: any[];

    async getFafMovies() {
        if (!this.fafMovies) {
            if (fs.existsSync(fafPath)) {
                this.fafMovies = JSON.parse(fs.readFileSync(fafPath).toString());
            } else {
                this.fafMovies = await this.getMovies("Fast & Furious")
                fs.writeFileSync(fafPath, JSON.stringify(this.fafMovies));
            }
        }

        return this.fafMovies;
    }

    async getPdcMovies(): Promise<any[]> {
        if (!this.pdcMovies) {
            if (fs.existsSync(pdcPath)) {
                this.pdcMovies = JSON.parse(fs.readFileSync(pdcPath).toString());
            } else {
                this.pdcMovies = await this.getMovies("Pirates of the Caribbean")
                fs.writeFileSync(pdcPath, JSON.stringify(this.pdcMovies));
            }
            let swActors = await this.getSwActors()

            this.pdcMovies?.forEach(movie => {
                let actors = movie.Acteurs.split(", ");
                movie.Avant2015 = Number(movie.Année) < 2015;
                movie.PaulWalker = actors.includes("Paul Walker");
                movie.StarWars = swActors.filter(actor => actors.includes(actor))?.toString();
            })
        }
        return this.pdcMovies ?? [];
    }

    private async getSwActors() {
        let swMovies;
        if (fs.existsSync(swPath)) {
            swMovies = JSON.parse(fs.readFileSync(swPath).toString());
        } else {
            swMovies = await this.getMovies("Star wars")
            fs.writeFileSync(swPath, JSON.stringify(swMovies));
        }

        let swActors = [];
        for (const movie of swMovies) {
            swActors.push(...movie.Acteurs.split(", "));
        }
        swActors = [...new Set(swActors)];
        return swActors;
    }

    async saveToSpreadsheet(data: any[]) {
        const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
        await doc.useServiceAccountAuth({
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL as string,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.split(String.raw`\n`).join('\n') as string,
        });
        await doc.loadInfo(); // loads document properties and worksheets

        const sheet = doc.sheetsByIndex[0]; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]
        await sheet.setHeaderRow(["Image", "Title", "Année", "Réalisateur", "Acteurs", "Avant2015", "PaulWalker",
            "StarWars"]); // updates document properties

        const moreRows = await sheet.addRows(data);
        console.log("Data to spreadsheet saved");
    }

    async getMovies(title: string) {
        let movies: any[] = [];
        let needPagination = true;
        let i = 1;
        while (needPagination === true) {
            await axios.get("https://www.omdbapi.com", {
                params: {
                    s: title,
                    apikey: omdbApiKey,
                    type: "movie",
                    page: i
                }
            })
                .then((response) => {
                    return response.data;
                })
                .then(async (search_movies) => {
                    if (search_movies.Search.length < 10 || i * 10 == search_movies.totalResults) {
                        needPagination = false;
                    } else {
                        i++
                    }
                    for (let movie of search_movies.Search) {
                        console.log(movie);
                        var detailedMovie = await this.getMovie(movie.imdbID);
                        // console.log(typeof detailedMovie)
                        if (detailedMovie.Image != "N/A"
                            && detailedMovie.Réalisateur != "N/A"
                            && detailedMovie.Acteurs != "N/A") {
                            movies.push(detailedMovie);
                        } else {
                            console.log("Not added:  ", movie)
                        }
                    }
                    return movies;
                })
                .catch(error => {
                    console.error(error);
                    needPagination = false;
                });
        }
        return movies;
    }

    async getMovie(imdbId: string): Promise<any> {
        return await axios.get("https://www.omdbapi.com", {
            params: {
                i: imdbId,
                apikey: omdbApiKey
            }
        })
            .then(r => r.data)
            .then(movie => {
                return {
                    Image: movie.Poster,
                    Title: movie.Title,
                    Année: movie.Year,
                    Réalisateur: movie.Director,
                    Acteurs: movie.Actors
                }
            })
            .catch(reason => console.error(reason))
    }
}