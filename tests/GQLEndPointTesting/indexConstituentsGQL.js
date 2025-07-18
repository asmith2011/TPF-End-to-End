import http from "k6/http";
import { Trend, Rate } from "k6/metrics";
import { check, group, fail } from "k6";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var indexConstituentsTime = new Trend("custom_dividends_response_time");

export const options = {
  stages: [{ duration: "1m", target: 8 }],
  thresholds: {
    http_req_failed: ["rate<0.01"], // http errors should be less than 1%
    http_req_duration: ["p(95)<6000"], // 95% of requests should be below 3000ms
  },
};
const headers = JSON.parse(open("../../data/headers.json"));
const indicesUK = JSON.parse(open("../../data/testData.json")).indicesUK;

export default function () {
  if (__ENV.ENDPOINT === undefined) {
    fail("Environment: ENDPOINT must be set");
  }

  var res;

  function testIndexConstituents(indexName, minCount, maxCount) {
    const query = `query {
                  indexConstituents(index: ${indexName}) {
                    totalCount
                    constituents {
                      symbol
                      type
                      marketCode
                      sedol
                      logo
                      name
                      price
                      dayChangePct
                      oneWeekChangePct
                      oneMonthChangePct
                      threeMonthChangePct
                      sixMonthChangePct
                      oneYearChangePct
                      dayChange
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
    check(body.data.indexConstituents.constituents.length, {
      "constitutents count is within range": (len) => len >= minCount && len <= maxCount,
    });
  
    check(body.data.indexConstituents.totalCount, {
      "count is within range": (count) => count >= minCount,
    });
    body.data.indexConstituents.constituents.forEach((instr) => {   
      if (indexName != "FTSE_AIM_100") {
        check(instr, {
        "sixMonthChangePct not null": (i) => i.sixMonthChangePct != null});  
      }   
      check(instr, {
        "symbol not null": (i) => i.symbol != null,
        "type not null": (i) => i.type != null,
        "marketCode not null": (i) => i.marketCode != null,
        "sedol not null": (i) => i.sedol != null,
        // 'logo not null': (i) => i.logo != null,
        "name not null": (i) => i.name != null,
        "price not null": (i) => i.price != null,
        "dayChangePct not null": (i) => i.dayChangePct != null,
        "threeMonthChangePct not null": (i) => i.threeMonthChangePct != null, 
        // 'oneYearChangePct not null': (i) => i.oneYearChangePct != null,
        "type is equity ETF or CEF": (i) =>
          i.type == "Equity" || i.type == "ETF" || i.type == "CEF",
        "marketCode has symbol": (i) => i.marketCode == `LSE:${i.symbol}`,
        "dayChange amount is not null": (i) => i.dayChange != null,
        "dayChange amount is a number": (i) => parseFloat(i.dayChange) != NaN,
      });
    });
    indexConstituentsTime.add(res.timings.duration);
  }
  
  group("FTSE_100 Index Constituents", function () {
    testIndexConstituents("FTSE_100", 100, 103);
  });
  
  group("FTSE_AIM_100 Index Constituents", function () {
    testIndexConstituents("FTSE_AIM_100", 100, 103);
  });
  
  group("FTSE_TECHMARK Index Constituents", function () {
    testIndexConstituents("FTSE_TECHMARK", 25, 9999);
  });

  group("No duplicates in Index Constituent pagination", function () {
    var i = Math.floor(Math.random() * 9 + 1);
    const query = `query		{
              indexConstituents(index: FTSE_ALL_SHARE, pagination :{pageToView:${i}, itemsPerPage:50}				
              ) {
                pageCount
                pageNumber
                totalCount
                constituents {
                  symbol
                    type
                    marketCode
                    logo
                    name
                    price
                    dayChangePct
                    oneWeekChangePct
                    oneMonthChangePct
                    threeMonthChangePct
                    sixMonthChangePct
                    oneYearChangePct
                }
              }
            }`;
    res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
      headers: headers.header1,
    });

    var body = JSON.parse(res.body);
    check(body.data.indexConstituents.constituents.length, {
      "more than 1 constitutent is available": (len) => len > 1,
    });
    var result1 = [];
    body.data.indexConstituents.constituents.forEach((r) => {
      result1.push(r.marketCode);
    });
    const query2 = `query		{
              indexConstituents(index: FTSE_ALL_SHARE, pagination :{pageToView:${
                i + 1
              }, itemsPerPage:50}				
              ) {
                pageCount
                pageNumber
                totalCount
                constituents {
                  symbol
                    type
                    marketCode
                    logo
                    name
                    price
                    dayChangePct
                    oneWeekChangePct
                    oneMonthChangePct
                    threeMonthChangePct
                    sixMonthChangePct
                    oneYearChangePct
                }
              }
            }`;
    res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query2 }), {
      headers: headers.header1,
    });

    body = JSON.parse(res.body);
    check(body.data.indexConstituents.constituents.length, {
      "more than 1 constitutent is available": (len) => len > 1,
    });
    var result2 = [];
    body.data.indexConstituents.constituents.forEach((r) => {
      result2.push(r.marketCode);
    });
    const common = result1.filter((value) => result2.includes(value));
    if (common.length != 0) {
      console.log(result1);
      console.log(result2); //- For debugging
      console.log(`Common = ${common}`);
    }
    check(common.length, {
      "no common constituents in Pagination": (len) => len == 0,
    });
  });

  indicesUK.forEach((index) => {
    group("Pagination in Index Constituents", function () {
      const query = `query		{
                indexConstituents(index: ${index}, pagination :{pageToView:${Math.floor(
        Math.random() * 9 + 1
      )}, itemsPerPage:10}				
                ) {
                  pageCount
                  pageNumber
                  totalCount
                  constituents {
                    symbol
                    type
                    marketCode
                    logo
                    name
                    price
                    dayChangePct
                    oneWeekChangePct
                    oneMonthChangePct
                    threeMonthChangePct
                    sixMonthChangePct
                    oneYearChangePct
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
      check(body.data.indexConstituents.pageCount, {
        "count is 10 OR 9": (p) => p == 10 || p == 9,
      });
      check(body.data.indexConstituents.pageNumber, {
        "random page number between 1 to 9": (n) => n > 0 && n < 10,
      });
      check(body.data.indexConstituents.totalCount, {
        "total count is more than 100": (c) => c > 99,
      });

      body.data.indexConstituents.constituents.forEach((instr) => {
        check(instr, {
          "symbol not null": (i) => i.symbol != null,
          "type not null": (i) => i.type != null,
          "marketCode not null": (i) => i.marketCode != null,
          // 'logo not null': (i) => i.logo != null,
          "name not null": (i) => i.name != null,
          "price not null": (i) => i.price != null,
          "dayChangePct not null": (i) => i.dayChangePct != null,
          // "threeMonthChangePct not null": (i) => i.threeMonthChangePct != null,
          // "sixMonthChangePct not null": (i) => i.sixMonthChangePct != null,
          // 'oneYearChangePct not null': (i) => i.oneYearChangePct != null,
          "type is equity ETF or CEF": (i) =>
            i.type == "Equity" || i.type == "ETF" || i.type == "CEF",
          "marketCode has symbol": (i) => i.marketCode == `LSE:${i.symbol}`,
        });
      });
      if (body.data.indexConstituents.pageCount != 10) {
        console.log(`INDEX ${index}`);
        console.log(body); //- Failure reporting
      }
      indexConstituentsTime.add(res.timings.duration);
    });
  });
}

export function handleSummary(data) {
  return {
    "GQLReports/indexConstituentsGQL Test.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
