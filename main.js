/**
 * This template is a production ready boilerplate for developing with `CheerioCrawler`.
 * Use this to bootstrap your projects using the most up-to-date code.
 * If you're looking for examples or want to learn more, see README.
 */

const Apify = require('apify');
const {handleStart, handleList, handleDetail} = require('./src/routes');
const {CheerioCrawler} = require("apify");
const {
    utils: {log, requestAsBrowser},
} = require("apify");

Apify.main(async () => {

    const {searchTerms} = await Apify.getInput();
    const dataset = await Apify.openDataset();

    let sRequests = Array();

    searchTerms.forEach(el => {
            sRequests.push(new Apify.Request(
                {
                    url: `https://en.wikipedia.org/w/index.php?search=${el.toLowerCase().replace(' ', '+')}&title=Special%3ASearch&profile=advanced&fulltext=1&ns0=1&wprov=acrw1_-1`,
                    userData: {label: el}
                }
            ))
        }
    )  /*🤗*/


    const requestList = await Apify.openRequestList('start-urls', sRequests);

    const crawler = new Apify.CheerioCrawler({
        requestList,
        maxConcurrency: 1,
        handlePageFunction: async ({request, $}) => {
            let resp = await requestAsBrowser(request),
                h1texts = Array();
            $('.mw-search-result-heading').each((index, el) => {
                h1texts.push({
                    text: $(el).text(),
                });
            });
            let logString = "";
            h1texts.forEach(el => {
                logString += ", " + el.text;
            })
            log.info(`\n\n${request.userData.label.toUpperCase()}: ${logString};\n\n`);
            await dataset.pushData({
                searchTerm: request.userData.label.toUpperCase(),
                results: h1texts
            })
        },
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Crawl finished.');
})
;
