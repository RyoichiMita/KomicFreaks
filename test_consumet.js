import { ANIME } from "@consumet/extensions";

const hianime = new ANIME.Hianime();

async function run() {
  console.log("Searching for one piece...");
  const res = await hianime.search("one piece");
  const anime = res.results[0];
  console.log("Found:", anime.id);

  console.log("Fetching info...");
  const episodes = await hianime.fetchAnimeInfo(anime.id);
  const ep = episodes.episodes.find(e => e.number === 467);
  if (!ep) {
    console.log("Ep not found");
    return;
  }
  console.log("Episode ID:", ep.id);

  console.log("Fetching sources...");
  const sources = await hianime.fetchEpisodeSources(ep.id);
  console.log("Sources:", sources.sources.map(s => s.url));
}

run().catch(console.error);
