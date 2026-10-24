import { belloFetch } from "../../../services/dataFetcher.js";
import { setResponseError } from "../../../helpers/error.js";
import SamehadakuParserExtra from "./SamehadakuParserExtra.js";
import path from "path";
export default class SamehadakuParser extends SamehadakuParserExtra {
    cachedNonce = { nonce: "", expiresAt: 0 };
    async getFreshNonce() {
        if (this.cachedNonce.nonce && Date.now() < this.cachedNonce.expiresAt) {
            return this.cachedNonce.nonce;
        }
        try {
            const html = await belloFetch(`${this.baseUrl}/anime-terbaru/`, this.baseUrl);
            const episodeMatch = html.match(/href="([^"]+-episode-\d+[^"]*)"/);
            if (episodeMatch) {
                const epHtml = await belloFetch(episodeMatch[1], this.baseUrl);
                const nonceMatch = epHtml.match(/"nonce"\s*:\s*"([^"]+)"/);
                if (nonceMatch) {
                    this.cachedNonce = {
                        nonce: nonceMatch[1],
                        expiresAt: Date.now() + 12 * 60 * 60 * 1000,
                    };
                    return nonceMatch[1];
                }
            }
        }
        catch (e) {
            console.warn("Gagal mengambil nonce baru:", e);
        }
        return "";
    }
    parseHome() {
        return this.scrape({
            path: "/",
            initialData: {
                recent: { href: "", samehadakuUrl: "", animeList: [] },
                batch: { href: "", samehadakuUrl: "", batchList: [] },
                movie: { href: "", samehadakuUrl: "", animeList: [] },
                top10: { href: "", samehadakuUrl: "", animeList: [] },
            },
        }, async ($, data) => {
            data.recent.href = this.generateHref("recent");
            data.recent.samehadakuUrl = this.generateSourceUrl($(".wp-block-button__link").attr("href") || "/anime-terbaru/");
            data.batch.href = this.generateHref("batch");
            data.batch.samehadakuUrl = this.generateSourceUrl($(".widget-title h3 .linkwidget").attr("href") || "/daftar-batch/");
            data.movie.href = this.generateHref("movies");
            data.movie.samehadakuUrl = this.generateSourceUrl($(".widgets h3 .linkwidget, .widgets a[href*='movie']").attr("href") || "/anime-movie/");
            data.top10.href = this.generateHref("top10");
            data.top10.samehadakuUrl = this.generateSourceUrl("/");
            const animeWrapperElements = $(".latestepisode_widget .post-show, .post-show").toArray();
            animeWrapperElements.forEach((animeWrapperEl, index) => {
                const animeElements = $(animeWrapperEl).find("ul li").toArray();
                animeElements.forEach((animeEl) => {
                    const card = this.parseAnimeCard1($(animeEl), index === 0 ? "anime" : "batch");
                    (index === 0 ? data.recent.animeList : data.batch.batchList).push(card);
                });
            });
            const animeMovieElements = $(".widgets.getpostanime_widget .widgetseries ul li, .widgetseries ul li").toArray();
            animeMovieElements.forEach((animeMovieElement) => {
                const card = this.parseAnimeCard3($, $(animeMovieElement));
                if (card.title && card.animeId) {
                    data.movie.animeList.push(card);
                }
            });
            data.top10.animeList = this.parseTop10List($);
            const isEmpty = data.recent.animeList.length === 0 &&
                data.top10.animeList.length === 0;
            this.checkEmptyData(isEmpty);
            return data;
        });
    }
    parseAllGenres() {
        return this.scrape({
            path: "/daftar-anime-2",
            initialData: { genreList: [] },
        }, async ($, data) => {
            const xData = $('[x-data*="genreMultiSelect"]').attr("x-data") || "";
            const match = xData.match(/genres:\s*(\[\s*\{.*?\}\s*\])/s);
            if (match) {
                try {
                    const list = JSON.parse(match[1]);
                    list.forEach((genre) => {
                        const title = genre.name;
                        const genreId = genre.slug;
                        const oriUrl = `${this.baseUrl}/genre/${genreId}`;
                        const samehadakuUrl = this.generateSourceUrl(oriUrl);
                        const href = this.generateHref("genres", genreId);
                        data.genreList.push({
                            title,
                            genreId,
                            href,
                            samehadakuUrl,
                        });
                    });
                }
                catch (e) {
                    console.warn("Gagal mem-parse genre dari x-data:", e);
                }
            }
            if (data.genreList.length === 0) {
                const genreElements = $(".filter_act.genres .tax_fil, label[class*='genre'], a[href*='/genre/']").toArray();
                const seen = new Set();
                genreElements.forEach((genreElement) => {
                    const val = $(genreElement).find("input").attr("value") ||
                        $(genreElement).attr("data-value") ||
                        "";
                    const title = $(genreElement).text().trim();
                    const oriUrl = val ? `${this.baseUrl}/genre/${val}` : ($(genreElement).attr("href") || "");
                    const samehadakuUrl = this.generateSourceUrl(oriUrl);
                    const genreId = this.generateSlug(oriUrl) || val;
                    const href = this.generateHref("genres", genreId);
                    if (title && genreId && !seen.has(genreId)) {
                        seen.add(genreId);
                        data.genreList.push({
                            title,
                            genreId,
                            href,
                            samehadakuUrl,
                        });
                    }
                });
            }
            const isEmpty = data.genreList.length === 0;
            this.checkEmptyData(isEmpty);
            return data;
        });
    }
    parseAllAnimes() {
        return this.scrape({
            path: "/daftar-anime-2/?list",
            initialData: { list: [] },
        }, async ($, data) => {
            const listElements = $(".listpst .listbar").toArray();
            listElements.forEach((listElement) => {
                const animeList = [];
                const startWith = $(listElement).find(".listabj").text();
                const animeElements = $(listElement).find(".listttl ul li a").toArray();
                animeElements.forEach((animeElement) => {
                    const card = this.parseLinkCard($(animeElement), "anime");
                    animeList.push({
                        title: card.title,
                        animeId: card.slug,
                        href: card.href,
                        samehadakuUrl: card.samehadakuUrl,
                    });
                });
                data.list.push({
                    startWith,
                    animeList,
                });
            });
            const isEmpty = data.list.length === 0;
            this.checkEmptyData(isEmpty);
            return data;
        });
    }
    parseSchedule() {
        return this.scrape({
            path: "/jadwal-rilis",
            initialData: { days: [] },
        }, async ($, data) => {
            const dayElements = $(".east_days_option, .schedule .tab-dates").toArray();
            const scheduleContainers = $(".result-schedule").toArray();
            dayElements.forEach((dayElement, index) => {
                const day = $(dayElement).text().trim();
                const animeList = [];
                const container = scheduleContainers[index] || $(dayElement).next();
                const animeElements = $(container).find(".animepost").toArray();
                animeElements.forEach((animeElement) => {
                    const card = this.parseAnimeCard4($(animeElement));
                    animeList.push(card);
                });
                data.days.push({
                    day,
                    animeList,
                });
            });
            const isEmpty = data.days.length === 0;
            this.checkEmptyData(isEmpty);
            return data;
        });
    }
    parseRecentAnime(page) {
        return this.scrape({
            path: `/anime-terbaru/page/${page}`,
            initialData: { data: { animeList: [] } },
        }, async ($, { data, pagination }) => {
            const animeElements = $(".post-show ul li").toArray();
            animeElements.forEach((animeElement) => {
                const card = this.parseAnimeCard1($(animeElement), "anime");
                data.animeList.push(card);
            });
            pagination = this.parsePagination($);
            const isEmpty = data.animeList.length === 0;
            this.checkEmptyData(isEmpty);
            return { data, pagination };
        });
    }
    parseOngoingAnimes(page, order) {
        return this.scrape({
            path: `/daftar-anime-2/page/${page}/?status=Currently%20Airing&order=${order}`,
            initialData: { data: { animeList: [] } },
        }, async ($, { data, pagination }) => {
            data = this.parseAnimeCard2List($, "anime");
            pagination = this.parsePagination($);
            return { data, pagination };
        });
    }
    parseCompletedAnimes(page, order) {
        return this.scrape({
            path: `/daftar-anime-2/page/${page}/?status=Finished%20Airing&order=${order}`,
            initialData: { data: { animeList: [] } },
        }, async ($, { data, pagination }) => {
            data = this.parseAnimeCard2List($, "anime");
            pagination = this.parsePagination($);
            return { data, pagination };
        });
    }
    parsePopularAnimes(page) {
        return this.scrape({
            path: `/daftar-anime-2/page/${page}/?order=popular`,
            initialData: { data: { animeList: [] } },
        }, async ($, { data, pagination }) => {
            data = this.parseAnimeCard2List($, "anime");
            pagination = this.parsePagination($);
            return { data, pagination };
        });
    }
    parseMovies(page) {
        return this.scrape({
            path: `/daftar-anime-2/page/${page}/?type=Movie`,
            initialData: { data: { animeList: [] } },
        }, async ($, { data, pagination }) => {
            data = this.parseAnimeCard2List($, "anime");
            pagination = this.parsePagination($);
            return { data, pagination };
        });
    }
    parseBatches(page) {
        return this.scrape({
            path: `/daftar-batch/page/${page}`,
            initialData: { data: { batchList: [] } },
        }, async ($, { data, pagination }) => {
            data.batchList = this.parseAnimeCard2List($, "batch").animeList;
            pagination = this.parsePagination($);
            return { data, pagination };
        });
    }
    parseSearch(q, page) {
        return this.scrape({
            path: `/page/${page}/?s=${q}`,
            initialData: { data: { animeList: [] } },
        }, async ($, { data, pagination }) => {
            data = this.parseAnimeCard2List($, "anime");
            pagination = this.parsePagination($);
            return { data, pagination };
        });
    }
    parseGenreAnimes(genreId, page) {
        return this.scrape({
            path: `/genre/${genreId}/page/${page}`,
            initialData: { data: { animeList: [] } },
        }, async ($, { data, pagination }) => {
            const postShowItems = $(".post-show ul li").toArray();
            if (postShowItems.length > 0) {
                postShowItems.forEach((el) => {
                    data.animeList.push(this.parseAnimeCard1($(el), "anime"));
                });
            }
            else {
                data = this.parseAnimeCard2List($, "anime");
            }
            pagination = this.parsePagination($);
            const isEmpty = data.animeList.length === 0;
            this.checkEmptyData(isEmpty);
            return { data, pagination };
        });
    }
    async parseAnimeDetails(animeId) {
        if (animeId.includes("-episode-")) {
            try {
                const epData = await this.parseAnimeEpisode(animeId, this.baseUrl);
                if (epData && epData.animeId && epData.animeId !== animeId) {
                    return this.parseAnimeDetails(epData.animeId);
                }
            }
            catch {
                const cleanId = animeId.replace(/-episode-\d+.*$/i, "");
                if (cleanId && cleanId !== animeId) {
                    return this.parseAnimeDetails(cleanId);
                }
            }
        }
        return this.scrape({
            path: `/anime/${animeId}`,
            initialData: {
                title: "",
                poster: "",
                score: { value: "", users: "" },
                japanese: "",
                synonyms: "",
                english: "",
                status: "",
                type: "",
                source: "",
                duration: "",
                episodes: 0,
                season: "",
                studios: "",
                producers: "",
                aired: "",
                trailer: "",
                synopsis: { paragraphs: [], connections: [] },
                genreList: [],
                batchList: [],
                episodeList: [],
            },
        }, async ($, data) => {
            const info = this.parseDetails($);
            const batchElements = $("a[href*='/batch/'], .listbatch a").toArray();
            batchElements.forEach((batchElement) => {
                const oriUrl = $(batchElement).attr("href");
                const title = $(batchElement).text().trim();
                const samehadakuUrl = this.generateSourceUrl(oriUrl);
                const batchId = this.generateSlug(oriUrl);
                const href = this.generateHref("batch", batchId);
                if (batchId) {
                    data.batchList.push({
                        title,
                        batchId,
                        href,
                        samehadakuUrl,
                    });
                }
            });
            const genreElements = $(".flex.items-center.gap-1\\.5 a[href*='/genre/'], .genre-info a").toArray();
            genreElements.forEach((genreElement) => {
                const card = this.parseLinkCard($(genreElement), "genres");
                data.genreList.push({
                    title: card.title,
                    genreId: card.slug,
                    href: card.href,
                    samehadakuUrl: card.samehadakuUrl,
                });
            });
            const episodeElements = $("h4 a[href*='-episode-'], .lstepsiode ul li .eps a, [class*='episode'] a[href*='-episode-']").toArray();
            const seenEpisodes = new Set();
            episodeElements.forEach((episodeElement) => {
                const card = this.parseLinkCard($(episodeElement), "episode");
                if (!card.slug || seenEpisodes.has(card.slug))
                    return;
                seenEpisodes.add(card.slug);
                const epNumMatch = card.title.match(/Episode\s+(\d+)/i) || card.title.match(/(\d+)/);
                const epTitle = epNumMatch ? Number(epNumMatch[1]) : this.num(card.title.split(" ")[0]);
                data.episodeList.push({
                    title: epTitle,
                    episodeId: card.slug,
                    href: card.href,
                    samehadakuUrl: card.samehadakuUrl,
                });
            });
            data.title = $("h1").first().text().replace("Nonton Anime", "").replace("Sub Indo", "").trim();
            data.poster = this.str($("img[src*='/uploads/'], .thumb img, .infoanime .thumb img").first().attr("src"));
            data.score.value = $(".score, .rating-area [itemprop=ratingValue]").first().text().replace("★", "").trim();
            data.score.users = $(".rating-area [itemprop=ratingCount]").text().trim();
            data.episodes = this.num(info.totalEpisode);
            data.studios = info.studio;
            data.aired = info.released;
            data.trailer = this.str($(".trailer-anime iframe, iframe[src*='youtube']").attr("src"));
            data.synopsis = this.parseSynopsis($);
            delete info["totalEpisode"];
            delete info["studio"];
            delete info["released"];
            data = { ...data, ...info };
            const isEmpty = !data.title && data.episodeList.length === 0 && data.genreList.length === 0;
            this.checkEmptyData(isEmpty);
            return data;
        });
    }
    parseAnimeEpisode(episodeId, originUrl) {
        return this.scrape({
            path: `/${episodeId}`,
            initialData: {
                title: "",
                animeId: "",
                poster: "",
                releasedOn: "",
                defaultStreamingUrl: "",
                hasPrevEpisode: false,
                prevEpisode: null,
                hasNextEpisode: false,
                nextEpisode: null,
                synopsis: { paragraphs: [], connections: [] },
                genreList: [],
                server: { qualities: [] },
                downloadUrl: { formats: [] },
                recommendedEpisodeList: [],
                movie: { href: "", samehadakuUrl: "", animeList: [] },
            },
        }, async ($, data) => {
            const html = $.html();
            const nonceMatch = html.match(/"nonce"\s*:\s*"([^"]+)"/);
            const nonce = nonceMatch ? nonceMatch[1] : await this.getFreshNonce();
            if (nonce) {
                this.cachedNonce = {
                    nonce,
                    expiresAt: Date.now() + 12 * 60 * 60 * 1000,
                };
            }
            const getDefaultStreaming = async () => {
                const el = $($(".east_player_option")[0]);
                const postData = el.attr("data-post");
                const numeData = el.attr("data-nume");
                const typeData = el.attr("data-type");
                const result = await belloFetch(`${this.baseUrl}/wp-admin/admin-ajax.php`, `${this.baseUrl}/${episodeId}`, {
                    method: "POST",
                    responseType: "text",
                    form: {
                        action: "player_ajax",
                        nonce: nonce,
                        post: this.str(postData),
                        nume: this.str(numeData),
                        type: this.str(typeData),
                    },
                });
                return this.generateSrcFromIframeTag(result).replace(/&#038;/g, "&");
            };
            data.title = $("h1.entry-title, h1").first().text().replace("Nonton Anime", "").replace("Sub Indo", "").trim();
            data.animeId = this.generateSlug($(".naveps .nvs.nvsc a, a[href*='/anime/']").attr("href"));
            data.poster = this.str($("img[src*='/uploads/'], .thumb img").first().attr("src"));
            data.releasedOn = $(".time-post, [class*='time']").text().trim();
            data.defaultStreamingUrl = await getDefaultStreaming();
            data.downloadUrl = this.parseDownloadUrl($);
            if (data.defaultStreamingUrl.includes("api.wibufile.com")) {
                data.defaultStreamingUrl =
                    originUrl + this.generateHref("/", `wibufile?url=${data.defaultStreamingUrl}`);
            }
            const serverElements = $(".server_option ul li .east_player_option, .east_player_option").toArray();
            const serverQualities = [
                { title: "unknown", serverList: [] },
                { title: "360p", serverList: [] },
                { title: "480p", serverList: [] },
                { title: "720p", serverList: [] },
                { title: "1080p", serverList: [] },
                { title: "4k", serverList: [] },
            ];
            let fixedServerQualities = [];
            serverQualities.forEach((quality) => {
                serverElements.forEach((serverElement) => {
                    if (!$(serverElement).attr("style")?.includes("not-allowed")) {
                        const title = $(serverElement).text().trim();
                        if (title.toLowerCase().includes(quality.title)) {
                            fixedServerQualities.push(title);
                        }
                    }
                });
            });
            const seenServers = new Set();
            serverQualities.forEach((quality) => {
                serverElements.forEach((serverElement) => {
                    if (!$(serverElement).attr("style")?.includes("not-allowed")) {
                        const title = $(serverElement).text().trim();
                        const postData = this.str($(serverElement).attr("data-post"));
                        const numeData = this.str($(serverElement).attr("data-nume"));
                        const typeData = this.str($(serverElement).attr("data-type"));
                        const serverKey = `${postData}-${numeData}-${typeData}`;
                        if (seenServers.has(serverKey) && quality.title === "unknown")
                            return;
                        const serverId = this.enrawr(`${postData}-${numeData}-${typeData}-${nonce}`);
                        const href = this.generateHref("server", serverId);
                        if (title.toLowerCase().includes(quality.title)) {
                            seenServers.add(serverKey);
                            quality.serverList.push({ title, serverId, href });
                        }
                        else {
                            if (!fixedServerQualities.includes(title) && quality.title === "unknown") {
                                seenServers.add(serverKey);
                                quality.serverList.push({ title, serverId, href });
                            }
                        }
                    }
                });
            });
            data.server.qualities = serverQualities;
            const navigationElements = $(".naveps .nvs:not(.nvsc) a").toArray();
            navigationElements.forEach((navigationElement, index) => {
                const card = this.parseLinkCard($(navigationElement), "episode");
                if (card.slug !== "#") {
                    if (index === 0) {
                        data.prevEpisode = {
                            title: "Prev",
                            episodeId: card.slug,
                            href: card.href,
                            samehadakuUrl: card.samehadakuUrl,
                        };
                    }
                    else {
                        data.nextEpisode = {
                            title: "Next",
                            episodeId: card.slug,
                            href: card.href,
                            samehadakuUrl: card.samehadakuUrl,
                        };
                    }
                }
            });
            data.hasPrevEpisode = data.prevEpisode ? true : false;
            data.hasNextEpisode = data.nextEpisode ? true : false;
            data.movie.href = this.generateHref("movies");
            data.movie.samehadakuUrl = this.generateSourceUrl($(".widgets h3 .linkwidget").attr("href"));
            const movieElements = $(".widgetseries ul li").toArray();
            movieElements.forEach((movieElement) => {
                const card = this.parseAnimeCard3($, $(movieElement));
                data.movie.animeList.push(card);
            });
            const connectionElements = $(".desc a").toArray();
            connectionElements.forEach((connectionElement) => {
                const card = this.parseLinkCard($(connectionElement), "anime");
                data.synopsis.connections?.push({
                    title: card.title,
                    animeId: card.slug,
                    href: card.href,
                    samehadakuUrl: card.samehadakuUrl,
                });
            });
            $(".desc a").remove();
            const paragraph = $(".desc").text().trim();
            data.synopsis.paragraphs.push(paragraph);
            const genreElements = $(".genre-info a").toArray();
            genreElements.forEach((genreElement) => {
                const card = this.parseLinkCard($(genreElement), "genres");
                data.genreList.push({
                    title: card.title,
                    genreId: card.slug,
                    href: card.href,
                    samehadakuUrl: card.samehadakuUrl,
                });
            });
            const animeElements = $(".lstepsiode ul li").toArray();
            animeElements.forEach((animeElement) => {
                const title = $(animeElement).find(".epsleft .lchx").text();
                const poster = this.str($(animeElement).find(".epsright img").attr("src"));
                const releaseDate = $(animeElement).find(".epsleft .date").text();
                const oriUrl = $(animeElement).find(".epsright a").attr("href");
                const samehadakuUrl = this.generateSourceUrl(oriUrl);
                const parsedEpisodeId = this.generateSlug(oriUrl);
                const href = this.generateHref("episode", parsedEpisodeId);
                data.recommendedEpisodeList.push({
                    title,
                    poster,
                    releaseDate,
                    episodeId: parsedEpisodeId,
                    href,
                    samehadakuUrl,
                });
            });
            const isEmpty = !data.title && data.genreList.length === 0 && data.downloadUrl.formats.length === 0;
            this.checkEmptyData(isEmpty);
            return data;
        });
    }
    async parseServerUrl(serverId, originUrl) {
        const data = { url: "" };
        const serverIdArr = this.derawr(serverId).split("-");
        const post = serverIdArr[0];
        const nume = serverIdArr[1];
        const type = serverIdArr[2];
        const nonce = serverIdArr[3] || (await this.getFreshNonce());
        const resultUrl = await belloFetch(`${this.baseUrl}/wp-admin/admin-ajax.php`, this.baseUrl, {
            method: "POST",
            responseType: "text",
            form: {
                action: "player_ajax",
                nonce: nonce,
                post: post || "",
                nume: nume || "",
                type: type || "",
            },
        });
        if (!resultUrl)
            setResponseError(400);
        data.url = this.generateSrcFromIframeTag(resultUrl).replace(/&#038;/g, "&");
        if (data.url.includes("api.wibufile.com")) {
            data.url =
                originUrl +
                    path.join("/", this.baseUrlPath, `wibufile?url=${data.url}`).replace(/\\/g, "/");
        }
        const isEmpty = !data.url || data.url === "No iframe found";
        this.checkEmptyData(isEmpty);
        return data;
    }
    parseWibuFile(url) {
        return belloFetch(url, this.baseUrl);
    }
    parseAnimeBatch(batchId) {
        return this.scrape({
            path: `/batch/${batchId}`,
            initialData: {
                title: "",
                animeId: "",
                poster: "",
                japanese: "",
                synonyms: "",
                english: "",
                status: "",
                type: "",
                source: "",
                score: "",
                duration: "",
                episodes: 0,
                season: "",
                studios: "",
                producers: "",
                aired: "",
                releasedOn: "",
                synopsis: { paragraphs: [], connections: [] },
                genreList: [],
                downloadUrl: { formats: [] },
                recommendedAnimeList: [],
            },
        }, async ($, data) => {
            const details = this.parseDetails($);
            data.title = $("h1.entry-title, h1").first().text().trim();
            data.animeId = this.generateSlug($($("#breadcrumbs li a, .breadcrumb a").toArray()[2] || $("a[href*='/anime/']")).attr("href"));
            data.episodes = this.num(details.totalEpisode);
            data.studios = details.studio;
            data.aired = details.released;
            data.releasedOn = $(".year").text().split("-")[1]?.trim() || "";
            data.poster = this.str($("img[src*='/uploads/'], .thumb-batch img, .thumb img").first().attr("src"));
            data.synopsis = this.parseSynopsis($);
            data.downloadUrl = this.parseDownloadUrl($);
            delete details["totalEpisode"];
            delete details["studio"];
            delete details["released"];
            delete details["genre"];
            const genreElements = $(".flex.items-center.gap-1\\.5 a[href*='/genre/'], .infox .spe span a, a[href*='/genre/']").toArray();
            const seenGenres = new Set();
            genreElements.forEach((genreElement) => {
                const card = this.parseLinkCard($(genreElement), "genres");
                if (!card.slug || seenGenres.has(card.slug))
                    return;
                seenGenres.add(card.slug);
                data.genreList.push({
                    title: card.title,
                    genreId: card.slug,
                    href: card.href,
                    samehadakuUrl: card.samehadakuUrl,
                });
            });
            const animeElements = $(".widget-post .animepost, .widgetseries ul li, .anime-grid article.animepost").toArray();
            animeElements.forEach((animeElement) => {
                const title = this.str($(animeElement).find("a").attr("title"));
                const poster = this.str($(animeElement).find("img").attr("src"));
                const oriUrl = $(animeElement).find("a").attr("href");
                const samehadakuUrl = this.generateSourceUrl(oriUrl);
                const animeId = this.generateSlug(oriUrl);
                const href = this.generateHref("anime", animeId);
                if (title && animeId) {
                    data.recommendedAnimeList.push({
                        title,
                        poster,
                        animeId,
                        href,
                        samehadakuUrl,
                    });
                }
            });
            data = { ...data, ...details };
            const isEmpty = !data.title && data.downloadUrl.formats.length === 0 && data.genreList.length === 0;
            this.checkEmptyData(isEmpty);
            return data;
        });
    }
}
