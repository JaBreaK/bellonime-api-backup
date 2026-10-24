import * as ISPE from "./interfaces/ISamehadakuParserExtra.js";
import * as ISP from "./interfaces/ISamehadakuParser.js";
import type { Cheerio, CheerioAPI, Element } from "cheerio";
import type { Pagination } from "@helpers/payload.js";
import type { Format, Quality, Url } from "@interfaces/IGlobal.js";
import AnimeScraper from "@scrapers/AnimeScraper.js";

export default class SamehadakuParserExtra extends AnimeScraper {
  protected parseAnimeCard1(el: Cheerio<Element>, to: "anime" | "batch"): ISPE.AnimeCard1 {
    const data: ISPE.AnimeCard1 = {
      title: "",
      poster: "",
      episodes: "",
      releasedOn: "",
      animeId: undefined,
      batchId: undefined,
      href: "",
      samehadakuUrl: "",
    };

    const oriUrl = el.find(".thumb a").attr("href");
    const titleLink = el.find(".dtla .entry-title a").attr("href");

    data.title = el.find(".dtla .entry-title").text().trim();
    data.poster = this.str(el.find(".thumb img").attr("src"));

    let episodes = "";
    el.find(".dtla span").each((_, s) => {
      const text = el.find(s).text();
      if (text.toLowerCase().includes("episode")) {
        episodes = text.replace(/episode/i, "").trim();
      }
    });
    if (!episodes) {
      episodes = el.find(".dtla span:not(.author) [itemprop=name]").text().trim();
    }
    data.episodes = episodes;

    data.releasedOn = el
      .find(".dtla span:last")
      .text()
      .toLowerCase()
      .replace("released on:", "")
      .trim();
    data.samehadakuUrl = this.generateSourceUrl(oriUrl);

    if (to === "anime") {
      const actualAnimeUrl = titleLink || oriUrl;
      data.animeId = this.generateSlug(actualAnimeUrl);
      data.episodeId = this.generateSlug(oriUrl);
      data.href = this.generateHref(to, data.animeId);
    } else {
      data.batchId = this.generateSlug(oriUrl);
      data.href = this.generateHref(to, data.batchId);
    }

    return data;
  }

  protected parseAnimeCard2(
    $: CheerioAPI,
    el: Cheerio<Element>,
    to: "anime" | "batch"
  ): ISPE.AnimeCard2 {
    const data: ISPE.AnimeCard2 = {
      title: "",
      poster: "",
      type: "",
      score: "",
      status: "",
      animeId: undefined,
      batchId: undefined,
      href: "",
      samehadakuUrl: "",
      genreList: [],
    };

    const oriUrl = el.find(".animposx a").attr("href");

    data.title =
      el.find(".animposx .data .title").text().trim() ||
      el.find(".animposx a").attr("title")?.trim() ||
      "";
    data.poster =
      this.str(el.find(".animposx .content-thumb img").attr("src")) ||
      this.str(el.find(".animposx .content-thumb img").attr("data-src")) ||
      this.str(el.find(".animposx .content-thumb [itemprop='image']").attr("src"));
    data.type = el.find(".animposx .content-thumb .type").text().trim();
    data.score = el.find(".animposx .content-thumb .score, .animposx .score").text().trim();
    data.status = el.find(".animposx .data .type").text().trim();
    data.samehadakuUrl = this.generateSourceUrl(oriUrl);

    if (to === "anime") {
      data.animeId = this.generateSlug(oriUrl);
      data.href = this.generateHref(to, data.animeId);
    } else {
      data.batchId = this.generateSlug(oriUrl);
      data.href = this.generateHref(to, data.batchId);
    }

    const genreElements = el.find(".stooltip .genres a").toArray();

    genreElements.forEach((genreElement) => {
      const card = this.parseLinkCard($(genreElement), "genres");

      data.genreList.push({
        title: card.title,
        genreId: card.slug,
        href: card.href,
        samehadakuUrl: card.samehadakuUrl,
      });
    });

    return data;
  }

  protected parseAnimeCard3($: CheerioAPI, el: Cheerio<Element>): ISPE.AnimeCard3 {
    const data: ISPE.AnimeCard3 = {
      title: "",
      poster: "",
      releaseDate: "",
      animeId: "",
      href: "",
      samehadakuUrl: "",
      genreList: [],
    };

    const oriUrl = el.find(".lftinfo h2 a").attr("href");

    data.title = el.find(".lftinfo h2").text();
    data.poster = this.str(el.find(".imgseries img").attr("src"));
    data.releaseDate = el.find(".lftinfo span:last").text().trim();
    data.samehadakuUrl = this.generateSourceUrl(oriUrl);
    data.animeId = this.generateSlug(oriUrl);
    data.href = this.generateHref("anime", data.animeId);

    const genreElements = el.find(".lftinfo span:first a").toArray();

    genreElements.forEach((genreElement) => {
      const card = this.parseLinkCard($(genreElement), "genres");

      data.genreList.push({
        title: card.title,
        genreId: card.slug,
        href: card.href,
        samehadakuUrl: card.samehadakuUrl,
      });
    });

    return data;
  }

  protected parseAnimeCard4(el: Cheerio<Element>): ISPE.AnimeCard4 {
    const data: ISPE.AnimeCard4 = {
      title: "",
      poster: "",
      type: "",
      score: "",
      estimation: "",
      genres: "",
      animeId: "",
      href: "",
      samehadakuUrl: "",
    };

    const oriUrl = el.find("a").attr("href");

    data.title = el.find(".data .title").text().trim();
    data.poster = this.str(el.find(".content-thumb img").attr("src"));
    data.type = el.find(".content-thumb .type").text();
    data.score = el.find(".content-thumb .score").text().trim().replace("x", "");
    data.estimation = el.find(".data_tw .ltseps").text().trim();
    data.samehadakuUrl = this.generateSourceUrl(oriUrl);
    data.animeId = this.generateSlug(oriUrl);
    data.href = this.generateHref("anime", data.animeId);
    data.genres = el.find(".data .type").text();

    return data;
  }

  protected parseLinkCard(el: Cheerio<Element>, to: string): ISPE.LinkCard {
    const data: ISPE.LinkCard = {
      title: "",
      slug: "",
      href: "",
      samehadakuUrl: "",
    };

    const oriUrl = el.attr("href");

    data.title = el.text();
    data.samehadakuUrl = this.generateSourceUrl(oriUrl);
    data.slug = this.generateSlug(oriUrl);
    data.href = this.generateHref(to, data.slug);

    return data;
  }

  protected parseAnimeCard2List($: CheerioAPI, to: "anime" | "batch"): ISP.Animes["data"] {
    const data: ISP.Animes["data"] = { animeList: [] };
    const animeElements = $(
      ".anime-grid article.animepost, .animpost .animepost, article.animepost, .animepost"
    ).toArray();

    animeElements.forEach((animeElement) => {
      const card = this.parseAnimeCard2($, $(animeElement), to);

      data.animeList.push(card);
    });

    const isEmpty = data.animeList.length === 0;

    this.checkEmptyData(isEmpty);

    return data;
  }

  protected parseDetails($: CheerioAPI): ISPE.InfoRecord {
    const details: ISPE.InfoRecord = {};

    // New grid layout under Detail/Informasi Anime
    const detailHeading = $("h1, h2, h3, h4")
      .filter(
        (_, el) =>
          $(el).text().includes("Detail Anime") || $(el).text().includes("Informasi Anime")
      )
      .first();

    const gridContainer = detailHeading.length
      ? detailHeading.parent().find(".grid > div")
      : $(".infox .spe span");

    gridContainer.each((_, el) => {
      const spans = $(el).find("span");
      if (spans.length >= 2) {
        let key = spans.first().text().replace(":", "").trim();
        const value = spans.last().text().trim();
        key = this.toCamelCase(key);
        details[key] = value;
      } else {
        let key = $(el).find("b").text();
        if (key) {
          const value = $(el).text().replace(key, "").replace(":", "").trim();
          key = this.toCamelCase(key).replace(":", "");
          details[key] = value;
        }
      }
    });

    return details;
  }

  protected parseSynopsis($: CheerioAPI) {
    const synopsis: ISPE.Synopsis = { paragraphs: [], connections: [] };
    const container = $(".entry-content.entry-content-single, .desc").first();
    const connectionElements = container.find("a").toArray();

    connectionElements.forEach((connectionElement) => {
      const card = this.parseLinkCard($(connectionElement), "anime");

      synopsis.connections?.push({
        title: card.title,
        animeId: card.slug,
        href: card.href,
        samehadakuUrl: card.samehadakuUrl,
      });
    });

    const cloned = container.clone();
    cloned.find("a").remove();

    const paragraphElements = cloned.find("p").toArray();
    if (paragraphElements.length > 0) {
      paragraphElements.forEach((paragraphElement) => {
        const text = $(paragraphElement).text().trim();
        if (text) synopsis.paragraphs.push(text);
      });
    } else {
      const text = cloned.text().trim();
      if (text) synopsis.paragraphs.push(text);
    }

    return synopsis;
  }

  protected parseDownloadUrl($: CheerioAPI) {
    const downloadUrl: { formats: Format[] } = { formats: [] };
    const downloadElements = $(".download-eps").toArray();

    downloadElements.forEach((downloadElement) => {
      const title = $(downloadElement).find("p").text();

      const qualities: Quality[] = [];
      const qualityElements = $(downloadElement).find("ul li").toArray();

      qualityElements.forEach((qualityElement) => {
        const title = $(qualityElement).find("strong").text();
        const urls: Url[] = [];
        const urlElements = $(qualityElement).find("span a").toArray();

        urlElements.forEach((urlElement) => {
          const title = $(urlElement).text();
          const url = this.str($(urlElement).attr("href"));

          urls.push({ title, url });
        });

        qualities.push({ title, urls });
      });

      downloadUrl.formats.push({ title, qualities });
    });

    return downloadUrl;
  }

  protected parsePagination($: CheerioAPI): Pagination | undefined {
    const data: Pagination = {
      currentPage: 1,
      hasPrevPage: false,
      prevPage: null,
      hasNextPage: false,
      nextPage: null,
      totalPages: 1,
    };

    const firstSpanEl = $(".pagination span:first")
      .text()
      .toLowerCase()
      .split(" ")
      .filter((str) => str !== "" && !isNaN(Number(str.trim())));

    data.currentPage = Number(firstSpanEl[0]) || 1;
    data.totalPages = Number(firstSpanEl[1]) || 1;
    data.prevPage = data.currentPage - 1 || null;
    data.hasPrevPage = data.prevPage ? true : false;
    data.nextPage = data.currentPage + 1 <= data.totalPages ? data.currentPage + 1 : null;
    data.hasNextPage = data.nextPage ? true : false;

    if (!data.currentPage && !data.totalPages && !data.prevPage && !data.nextPage) {
      return undefined;
    }

    return data;
  }

  protected parseTop10Card(el: Cheerio<Element>): ISPE.Top10AnimeCard {
    const linkEl = el.find("a.series");

    const oriUrl = linkEl.attr("href") || "";
    const posterUrl = linkEl.find("img").attr("src") || "";
    const rankText = linkEl.find(".is-topten").text().replace("TOP", "").trim();

    const data: ISPE.Top10AnimeCard = {
      rank: Number(rankText) || 0,
      title: linkEl.find(".judul").text(),
      poster: this.str(posterUrl) || "",
      score: linkEl.find(".rating").text().trim(),

      // TAMBAHKAN FALLBACK DI SINI
      animeId: this.generateSlug(oriUrl) || "",
      href: this.generateHref("anime", this.generateSlug(oriUrl) || "") || "",
      samehadakuUrl: this.generateSourceUrl(oriUrl) || "",
    };

    return data;
  }
  public parseTop10List($: CheerioAPI): ISPE.Top10AnimeCard[] {
    const animeList: ISPE.Top10AnimeCard[] = [];

    // Selector untuk menargetkan setiap item <li> di dalam widget Top 10
    const animeElements = $(".widget_senction .topten-animesu ul li").toArray();

    animeElements.forEach((animeElement) => {
      // Panggil parser untuk satu kartu
      const card = this.parseTop10Card($(animeElement));
      animeList.push(card);
    });

    return animeList;
  }
}
