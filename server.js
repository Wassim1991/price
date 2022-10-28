const PORT = 8000;
const axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");
const app = express();
const path = require('path');



/**
 * get:/api
 */

/**
 * get:root
 */

/**
 * get:/search/${searchterm}
 */


 


app.get("/search/:searchterm", async (req, res) => {
  let runAll = true;
  let pokeURL;
  const searchterm = req.params.searchterm;
  console.log(searchterm);
  let variations;
  let cardName = searchterm;
  const prices = [];

  if (searchterm.includes("/")) {
    const indexSplit = searchterm.lastIndexOf(" ");
    cardName = searchterm.substring(0, indexSplit);
    const cardCombination = searchterm.substring(indexSplit + 1).toLowerCase();
    const cardNumber = cardCombination.split("/")[0];
    const maxSet = cardCombination.split("/")[1];
    pokeURL = encodeURI(
      /*nomen maxsetcarte "= Miaouss" "numerocarte=4" "maxsetcarte=12" */
      'https://www.pokepedia.fr/index.php?title=Spécial:Recherche&limit=500&offset=0&ns0=1&search=nomen+maxsetcarte+"=' +
        cardName +
        '"+"numerocarte=' +
        cardNumber +
        '"+"maxsetcarte=' +
        maxSet +
        '"'
    );
  } else {
    pokeURL = encodeURI(
      'https://www.pokepedia.fr/index.php?title=Spécial:Recherche&limit=500&offset=0&ns0=1&search=nomen+maxsetcarte+"=' +
        searchterm +
        '"'
    );
  }
  console.log(pokeURL);
  variations = await firstcall(cardName, pokeURL);
  res.send(variations);
});

/**
 * firstcall
 * @param cardName
 * @param pokeURL
 * @returns {Promise<*[]>}
 */
async function firstcall(cardName, pokeURL) {
  let id = 0;
  let response = await axios(pokeURL);
  const html = response.data;
  const $ = cheerio.load(html);
  let variations = [];
  const elements = $("#mw-content-text > div.searchresults > ul > li");
  for (const element of elements) {
    names = $(element)
      .text()
      .split("\n")[0]
      .replaceAll(" = ", "=")
      .replaceAll(/{{.*?}}/g, "")
      .replaceAll("<small>", "")
      .replaceAll("</small>", "");

    //console.log(names);

    const nameFR = names.split(" (")[0];
    const nameEN = names.split("| nomen=")[1];
    const cardNumberStr = names.split(")")[0];
    const maxSet = $(element)
      .text()
      .split("\n")[1]
      .replaceAll(" = ", "=")
      .split("maxsetcarte=")[1];
    const cardNumber = cardNumberStr.substring(
      cardNumberStr.lastIndexOf(" ") + 1
    );
    const url =
      "https://www.pokepedia.fr" +
      $(element).find("div.mw-search-result-heading >a").attr("href");
    if (
      names
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .includes(
          cardName
            .toLocaleLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
        )
    ) {
      /*
      let variation = await secondCall(
        id++,
        nameFR,
        nameEN,
        cardNumber,
        maxSet,
        url
      );
      */
      variations.push({ id, nameFR, nameEN, cardNumber, maxSet, url });
    }
  }
  return variations;
}

/**
 * secondCall
 * @param id
 * @param nameFR
 * @param nameEN
 * @param cardNumber
 * @param maxSet
 * @param url
 * @returns {Promise<{maxSet, imgUrl: string, nameFR, id, nameEN, cardNumber, url}>}
 */
async function secondCall(id, nameFR, nameEN, cardNumber, maxSet, url) {
  //console.log("================>>>" + url)
  let response = await axios(url);
  const html = response.data;
  const $ = cheerio.load(html);
  const imgItem = $("tbody > tr:nth-child(2) > td > a > img").attr("src");
  const imgUrl =
    "https://www.pokepedia.fr/" +
    imgItem.split(".png")[0].replace("thumb/", "") +
    ".png";
  return { id, nameFR, nameEN, cardNumber, maxSet, url, imgUrl };
}
/*

//https://www.ebay.fr/sch/2536/i.html?_from=R40&_nkw=(Mamanbo,Alomomola)%2022/119&LH_PrefLoc=2&rt=nc&LH_Sold=1&LH_Complete=1
// /:nameEN/:cardNumber/:maxSet
app.get("price/:nameFR", (req,res)=>{

  console.log(req.params.nameFR)
 
    ebayURL = encodeURI(
      "https://www.ebay.fr/sch/2536/i.html?_from=R40&_nkw=(" +
      req.params.nameFR +
      "," +
      req.params.nameEN +
      ") " +
      req.params.cardNumber +
      "/" +
      req.params.cardNumber +
      "&LH_PrefLoc=2&LH_Sold=1&LH_Complete=1")
      console.log(ebayURL);
    const termsFR = [
      variations[0].nameFR
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""),
        variations[0].cardNumber.toLowerCase(),
      variations[0].maxSet.toLowerCase(),
    ];
    console.log(ebayURL);
    const termsEN = [
      variations[0].nameEN
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""),
        variations[0].cardNumber.toLowerCase(),
      variations[0].maxSet.toLowerCase(),
    ];
    console.log(termsEN);
    console.log(termsFR);
     axios(ebayURL)
      .then((response) => {
        const html = response.data;
        const $ = cheerio.load(html);
        $(
          "#srp-river-results > ul > li > div > div.s-item__info.clearfix"
        ).each((index, element) => {
          const title = $(element).find("a > div > span").text();
          console.log(title);
          if (
            termsEN.every((term) => title.toLowerCase().includes(term)) ||
            termsFR.every((term) => title.toLowerCase().includes(term))
          ) {
            const price = $(element)
              .find(
                "div.s-item__details.clearfix > div:nth-child(1) > span > span"
              )
              .text();
            const date = $(element)
              .find("div.s-item__title--tag > div > span.POSITIVE")
              .text()
              .replace("Vendu  ", "");
            const url = $(element).find("a").attr("href");
            let cardType ='normal'
            if (title.toLowerCase().includes('rev')){
              cardType='reverse'
            } else if ((/^(?!.*(non)).*holo.*$/).test(title.toLowerCase())){
              cardType='holo'
            }
            if (typeof req.params.cardType === 'undefined'){

            prices.push({
              title,
              url,
              price,
              date,
              cardType
            });
          }else if (req.params.cardType==cardType){
            prices.push({
              title,
              url,
              price,
              date,
              cardType
            })
          }
          }
        });
        res.json({ pokeURL, variations, ebayURL, prices});
      })
      .catch((err) => console.log(err.response));
  })
*/

app.listen(PORT, () => console.log(`server running on PORT ${PORT}`));

// manage accents PtÃŠra 180 / 196
// no maxset Zekrom BW38  or Astronelle-V (Promo SWSH 078)

app.get("/price/:nameEN/:cardNumber/:maxSet", (req, res) => {
//app.get("/price/:nameFR/:nameEN/:cardNumber/:maxSet", (req, res) => {

  id = 0;
  const prices = [];
  const { nameEN, cardNumber, maxSet } = req.params;
  ebayURL = encodeURI(
    "https://www.ebay.com/sch/2536/i.html?_from=R40&_nkw=(" +
      //nameFR +
      //"," +
      nameEN +
      ") " +
      cardNumber +
      "/" +
      maxSet +
      "&LH_PrefLoc=2&LH_Sold=1&LH_Complete=1&_ipg=240"
  );

  /*const termsFR = [
    nameFR
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""),
    cardNumber.toLowerCase(),
    maxSet.toLowerCase(),
  ];
  */
  const termsEN = [
    nameEN
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""),
    cardNumber.toLowerCase(),
    maxSet.toLowerCase(),
  ];

  console.log(ebayURL);
  axios(ebayURL)
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);

      $("#srp-river-results > ul > li > div > div.s-item__info.clearfix").each(
        (index, element) => {
          const title = $(element).find("a > div > span").text();
          if (
            termsEN.every((term) => title.toLowerCase().includes(term)) 
            //||termsFR.every((term) => title.toLowerCase().includes(term))
          ) {

          
            const price = $(element)
              .find(
                "div.s-item__details.clearfix > div:nth-child(1) > span > span"
              )
              .text();
            const date = $(element)
              .find("div.s-item__title--tag > div > span.POSITIVE")
              .text()
              .replace("Sold ", "");
            const url = $(element).find("a").attr("href");
            /*
            let cardType ='normal'
            if (title.toLowerCase().includes('rev')){
              cardType='reverse'
            } else if ((/^(?!.*(non)).*holo.*$/).test(title.toLowerCase())){
              cardType='holo'
            }
            */
            prices.push({
              id,
              title,
              url,
              price,
              date
            });
            id++;
          }
        }
      );
      res.json(prices);
    })
    .catch((err) => console.log(err.response));
});


app.use(express.static(path.join(__dirname, 'build')));

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

