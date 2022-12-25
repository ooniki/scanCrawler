'use strict';

const puppeteer = require('puppeteer');
const fs = require('fs');

const data = {
    name: 'dreamland',
    subName: 'tome',
    baseUrl: 'https://mangascan.ws/manga/dreamland',
    start: 20,
    count: 1
};


console.log("Scan Crawerl Script with parameters:");
console.log(data);

(async function main() {
  try {
    const browser = await puppeteer.launch();
    const [page] = await browser.pages();

    const allImgResponses = {};
    page.on('response', (response) => {
      if (response.request().resourceType() === 'image') {
        allImgResponses[response.url()] = response;
      }
    });

    fs.mkdir(data.name, { recursive: true }, (err) => {
        if (err) throw err;
      });

    for (let count = data.start ; count < data.count + data.start ; count++) {
        const currentSubNameFolder = `${data.name}/${data.subName}${count}`;
        fs.mkdir(currentSubNameFolder, { recursive: true }, (err) => {
            if (err) throw err;
        });

        const currentUrl = `${data.baseUrl}/${count}`;
        console.log(`Parsing: ${data.baseUrl}/${count}`)
        await page.goto(currentUrl);
        const selecedImgCount = await page.evaluate(() =>
            document.querySelectorAll('ul.dropdown-menu.inner.selectpicker')[0].childElementCount
        );
        console.log(`Found: ${selecedImgCount} images`);

        for (let nb = 1; nb <= selecedImgCount; nb++) {
            const currentSubUrl = `${currentUrl}/${nb}`;
            console.log(`Parsing: ${currentSubUrl}`);
            await page.goto(currentSubUrl);
    
            const selecedImgURLs = await page.evaluate(() =>
            Array.from(
                document.querySelectorAll('#ppp img.img-responsive'),
                function (data) {
                    return data.getAttribute('src');
                },
            )
            );
            console.log(`Found image: ${selecedImgURLs}`);
    
            for (const imgURL of selecedImgURLs) {
            fs.writeFileSync(
                `${currentSubNameFolder}/${nb}.${imgURL.slice(-3)}`,
                await allImgResponses[imgURL].buffer(),
            );
            }   
        }
    }

    await browser.close();
  } catch (err) {
    console.error(err);
  }
})();