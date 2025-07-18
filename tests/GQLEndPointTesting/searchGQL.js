import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group } from 'k6';
import { getCSVData } from "../../commonUtil/DataParmetrisation.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var searchStringRespTime = new Trend("searchString_response_time");
var searchStringStats = new Rate("searchString_stats");

const headers = JSON.parse(open("../../data/headers.json"));

var res;

export const options = {
  thresholds: {
    checks: ['rate>=1']
  },
};

export default function () {
  if (__ENV.ENDPOINT === undefined) {
    fail("Environment: ENDPOINT must be set");
  }

  var input = getCSVData();

  group('Search results', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var searchString = obj.searchString;

      if (searchString) {
        const query = `query {
      search(text: "${searchString}",type: [Equity, ETF]) {
        name
        symbol
        marketCode
        market
        type
      }
    }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers.header1,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });
        // Check Status = 200 & empty body when string has non-ascii characters
        if(/[^\u0000-\u007f]/.test(searchString)){
          check(body,{
            'has empty search results json body':(res)=> JSON.stringify(res) === JSON.stringify({"data":{"search":[]}})
          });
        }
        else{
          check(body.data.search[0], {
            'has valid Search result with name': (res) => res.name !== undefined && res.name !== "" && res.name !== null,
            'has valid Search result with symbol': (res) => res.symbol !== undefined && res.symbol !== "" && res.symbol !== null,
            'has valid Search result with marketCode': (res) => res.marketCode !== undefined && res.marketCode !== "" && res.marketCode !== null,
            'has valid Search result with market': (res) => res.market !== undefined && res.market !== "" && res.market !== null,
            'has valid Search result with type': (res) => res.type !== undefined && res.type !== "" && res.type !== null && (res.type === 'ETF' || res.type === 'Equity') 
          });
        }
      }
    }
    searchStringRespTime.add(res.timings.duration);
    searchStringStats.add(1);
  });
}

export function handleSummary(data) {
  return {
    "GQLReports/searchGQL Test.html": htmlReport(data),
     stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}