import http from "k6/http";
import { Trend, Rate } from "k6/metrics";
import { check, group, fail } from "k6";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var newsHeadlinesRespTime = new Trend("custom_newsHeadlines_response_time");
var marketSentimentRespTime = new Trend("custom_marketSentiment_response_time");

export const options = {
  stages: [{ duration: "2s", target: 2 }],
  thresholds: {
    http_req_failed: ["rate<0.01"], // http errors should be less than 1%
    http_req_duration: ["p(95)<2000"], // 95% of requests should be below 2000ms
  },
};
const headers = JSON.parse(open("../../data/headers.json"));
const keywordALLIANCE = JSON.parse(
  open("../../data/testData.json")
).keywordALLIANCE;
const keywordLSELSERNS = JSON.parse(
  open("../../data/testData.json")
).keywordLSELSERNS;
const sources = JSON.parse(open("../../data/testData.json")).sources;

export default function () {
  if (__ENV.ENDPOINT === undefined) {
    fail("Environment: ENDPOINT must be set");
  }

  var res;
  keywordALLIANCE.forEach(function (keyword) {
    group("ALLIANCE News Headlines", function () {
      const query = `query {
        newsHeadlines(
          startDate: "01/05/2022",
          endDate: "01/01/2025",
          sourceCode: ALLIANCE,
          keywords: ["${keyword}"]) {
          aggregate{
            count
          }
        }
      }`;
      res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
        headers: headers.header1,
      });

      var body = JSON.parse(res.body);
      check(res, {
        "is status 200": (r) => r.status === 200,
      });
      
      // console.log(keyword+" Count = "+body.data.newsHeadlines.aggregate.count);
      check(body.data.newsHeadlines.aggregate.count, {
        "ALLIANCE has news count more than 3": (count) => count > 3,
      });
      newsHeadlinesRespTime.add(res.timings.duration);
    });
  });

  group("Short title on AJB News", function () {
    const query = `query {
      newsHeadlines(sourceCode: ALLIANCE, keywords: "ALLAJB"){
        headlines {
            title
            titleShort
            tags
            typeCode
            dateTime
          }
        }
      }`;
    res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
      headers: headers.header1,
    });

    var body = JSON.parse(res.body);
    check(res, {
      "is status 200": (r) => r.status === 200,
    });

    //Check Short title & title of each news
    body.data.newsHeadlines.headlines.forEach((news) => {
      check(news.title.length, {
        "title is not empty": (title) => title > 0,
      });
      check(news.titleShort.length, {
        "short title is not empty": (title) => title > 0,
      });

      if (news.title.includes("LONDON MARKET ")) {
        check(news, {
          "titleShort is smaller than title": (news) =>
            news.title.length - news.titleShort.length >= 20,
        });
      }
    });
    newsHeadlinesRespTime.add(res.timings.duration);
  });

  group("DGAP symbols should be returned as LSE: in headlines", function () {
    const query = `query {
      newsHeadlines(symbol:["LSE:MTRO","XLON:MTRO"] startDate:"30/11/2023") {
        headlines {
          title dateTime source symbols
        }
      }
    }`;
    res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
      headers: headers.header1,
    });

    var body = JSON.parse(res.body);
    check(res, {
      "is status 200": (r) => r.status === 200,
    });

    //Check LSE:MTRO exists & XLON:MTRO doesnt exist
    body.data.newsHeadlines.headlines.forEach((news) => {
      check(news.symbols.length, {
        "symbols array in news is not empty": (arr) => arr > 0,
      });
      check(news.symbols, {
        "LSE:MTRO exists in symbols array": (arr) => arr.includes("LSE:MTRO"),
        "XLON:MTRO does not exists in symbols array": (arr) =>
          arr.indexOf("XLON:MTRO") === -1,
      });
    });
    newsHeadlinesRespTime.add(res.timings.duration);
  });

  Object.keys(keywordLSELSERNS)
    .forEach(function (keyword) {
      group("LSELSERNS, DGAPDGAPRNS, LSELSENORNS News Headlines", function () {
        const query = `query {
          newsHeadlines(sourceCode: [LSELSERNS, DGAPDGAPRNS, LSELSENORNS], 
          startDate: "01/10/2023", 
          endDate: "${new Date().toLocaleDateString('en-GB')}", 
          startAt: 0, endAt: 52, keywords: ["${keyword}"]) {
            aggregate {
              count
            }
            headlines {
              searchScore
              id
              title
              titleShort
              symbols
              typeCode
              type
              dateTime
              sourceCode
              source
              provider
              tags
              timestamp
            }
          }
        }`;
        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers.header1,
        });

        var body = JSON.parse(res.body);
        check(res, {
          "is status 200": (r) => r.status === 200,
        });
        // console.log(keyword+" Count = "+body.data.newsHeadlines.aggregate.count);
        if(body.data.newsHeadlines.aggregate.count != 0){
            check(body.data.newsHeadlines.aggregate, {
              [`${keyword} count is correct`]: (agg) => agg.count >= keywordLSELSERNS[keyword]
            });
        }
        newsHeadlinesRespTime.add(res.timings.duration);
      });
    });

  sources.forEach(function (source) {
    group("Market Sentiment", function () {
      const query = `query {
          marketSentiment(
            startDate: "01/05/2022",
            endDate: "30/05/2023"
            sourceCode: ${source}) {
              positivePercentage
              negativePercentage
          }
        }`;
      res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
        headers: headers.header1,
      });

      var body = JSON.parse(res.body);
      check(res, {
        "is status 200": (r) => r.status === 200,
      });

      check(body.data.marketSentiment.positivePercentage, {
        "positivePercentage between 0 and 100": (pos) => pos >= 0 && pos <= 100,
      });

      check(body.data.marketSentiment.negativePercentage, {
        "negativePercentage between 0 and 100": (pos) => pos >= 0 && pos <= 100,
      });

      marketSentimentRespTime.add(res.timings.duration);
    });
  });

  group("Test news article have HTML COntent", function () {
    const query = `query {
      newsHeadlines {
        headlines {
          title
          id
        }
      }
    }`;
    
    const res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
      headers: headers.header1,
    });

    const body = JSON.parse(res.body);
    check(res, {
      "is status 200": (r) => r.status === 200,
    });

    check(body.data.newsHeadlines.headlines, {
      "headlines array is not empty": (headlines) => headlines.length > 0,
    });

    if (body.data.newsHeadlines.headlines.length > 0) {
      const randomHeadline = body.data.newsHeadlines.headlines[
        Math.floor(Math.random() * body.data.newsHeadlines.headlines.length)
      ];

      check(randomHeadline.title, {
        "title is not empty": (title) => title && title.length > 0,
      });
      check(randomHeadline.id, {
        "id is not empty": (id) => id && id.length > 0,
      });

      group("Check HTML in Single article", function () {
        const singleQuery = `query {
          newsSingle(id: "${randomHeadline.id}") {
            title
            content
          }
        }`;

        const singleRes = http.post(__ENV.ENDPOINT, JSON.stringify({ query: singleQuery }), {
          headers: headers.header1,
        });

        const singleBody = JSON.parse(singleRes.body);
        check(singleRes, {
          "is status 200": (r) => r.status === 200,
        });

        check(singleBody.data.newsSingle, {
          "title is not empty": (article) => article.title.length > 0,
          "content is not empty": (article) => article.content.length > 0,
          "content contains HTML tags": (article) => /^<html[\s\S]*<\/html>$/i.test(article.content)
        });
      });
    }
  });
  
}

export function handleSummary(data) {
  return {
    "GQLReports/NewsHeadlinesGQL.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
