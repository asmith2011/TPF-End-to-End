import http from 'k6/http';
import { Trend, Rate, Counter } from "k6/metrics";
import { check, group } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var sharesMagzineRespTime = new Trend("sharesMagzine_response_time");
var statusCodeCounter = new Counter("status_code_count");

const headers = JSON.parse(open("../../data/headers.json"));
var res;

export const options = {
  thresholds: {
    checks: ['rate>=0.99']
  },
};

export default function () {
  if (__ENV.ENDPOINT === undefined) {
    fail("Environment: ENDPOINT must be set");
  }  

  group('Shares magzine test', function () {
    const query = `
      query ($quotesIdentifiers: [String!]!, $UKIds: [String!]!, $UKSD: String!, $UKST: String!, $UKType: HistoricPriceIntervalType!, $USIds: [String!]!, $USSD: String!, $USST: String!, $USType: HistoricPriceIntervalType!, $DEIds: [String!]!, $DESD: String!, $DEST: String!, $DEType: HistoricPriceIntervalType!, $FOREXIds: [String!]!, $FOREXSD: String!, $FOREXST: String!, $FOREXType: HistoricPriceIntervalType!) {
        quotes: quotes(identifiers: $quotesIdentifiers) {
          marketCode
          midPrice
          dayChange
          dayChangePct
        }
        UKPriceHistory: priceHistory(
          identifiers: $UKIds
          startDate: $UKSD
          startTime: $UKST
          endTime: "23:59:59"
          type: $UKType
        ) {
          symbol
          prices {
            date
            time
            lastPrice
          }
        }
        USPriceHistory: priceHistory(
          identifiers: $USIds
          startDate: $USSD
          startTime: $USST
          endTime: "23:59:59"
          type: $USType
        ) {
          symbol
          prices {
            date
            time
            lastPrice
          }
        }
        DEPriceHistory: priceHistory(
          identifiers: $DEIds
          startDate: $DESD
          startTime: $DEST
          endTime: "23:59:59"
          type: $DEType
        ) {
          symbol
          prices {
            date
            time
            lastPrice
          }
        }
        FOREXPriceHistory: priceHistory(
          identifiers: $FOREXIds
          startDate: $FOREXSD
          startTime: $FOREXST
          endTime: "23:59:59"
          type: $FOREXType
        ) {
          symbol
          prices {
            date
            time
            lastPrice
          }
        }
      }`;

    const variables = {
      quotesIdentifiers: ["FTSE:UKX", "FTSE:MCX", "FTSE:ASX", "FTSE:SMX", "FTSE:AXX", "DOW:DJI", "NASDAQ:COMP", "ETR:DAX"],
      UKIds: ["FTSE:UKX", "FTSE:MCX", "FTSE:ASX", "FTSE:SMX", "FTSE:AXX"],
      UKSD: "20/03/2025",
      UKST: "08:00:00",
      UKType: "MINUTE",
      USIds: ["DOW:DJI", "NASDAQ:COMP"],
      USSD: "20/03/2025",
      USST: "13:30:00",
      USType: "MINUTE",
      DEIds: ["ETR:DAX"],
      DESD: "20/03/2025",
      DEST: "08:00:00",
      DEType: "MINUTE",
      FOREXIds: ["FX:GBPUSD", "FX:EURGBP", "FX:EURUSD", "FX:USDJPY", "FX:AUDUSD"],
      FOREXSD: "20/03/2025",
      FOREXST: "00:00:00",
      FOREXType: "FIVE_MINUTE"
    };

    res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query, variables: variables }), {
      headers: headers.header1,
    });

    var body = JSON.parse(res.body);

    check(res, {
      'is status 200': (r) => {
        const isSuccess = r.status === 200;
        if (isSuccess) {
          sharesMagzineRespTime.add(r.timings.duration);
        }
        else {
         console.log(`Error: ${r.status} - ${r.status_text}`);
         console.log(`Response body: ${r.body}`);
        }
        statusCodeCounter.add(1, { status: r.status });
        return isSuccess;
      },
    });
    
  });

}

export function handleSummary(data) {
  const statusCodeCounts = data.metrics["status_code_count"].values;
  return {
    "GQLReports/sharesMagazineGQLTest.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }) + 
            `\n\nStatus Code Breakdown:\n` + 
            JSON.stringify(statusCodeCounts, null, 2),
  };
}