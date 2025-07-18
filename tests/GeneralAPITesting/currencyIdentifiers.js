import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";



var acceptingSedolRespTime = new Trend("currencyIdentifiers_response_time");
var acceptingSedolStats = new Rate("currencyIdentifiers_stats");

const identifiers = JSON.parse(open("../../data/marketcodes.json"));

const gqlHeaders = {
    'Content-Type': 'application/json',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept': 'application/json',
    'Connection': 'keep-alive',
    'DNT': '1'
};

export const options = {
    thresholds: {
      checks: ['rate>=1']
    },
  };
  
var gqlRes;

export default function () {
    if (__ENV.ENDPOINT === undefined) {
        fail("Environment: ENDPOINT must be set");
    }

    
    group('Accepting Sedol as an inbound parameter', function () {
        identifiers.forEach(function(instrument) {
            const query = `query {
                quote(identifier: "${instrument}") {
                    __typename
                    name
                    nameShort
                    currency
                    currencySymbol
                }
            } `;
    
            gqlRes = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
                headers: gqlHeaders,
            });

            check(gqlRes, {
                'is status 200': (r) => r.status === 200,
            });

            var body = JSON.parse(gqlRes.body);
            if(body.data != null){
                check(body, {
                    'currency is correct': (r) => r.data.quote.currency === "CHF" || "CAD" || "USD" || "EUR"
                })
              }
              else {
                console.log(`Error for ${instrument}`)
              }
        });

        acceptingSedolRespTime.add(gqlRes.timings.duration);
        acceptingSedolStats.add(1);
    });
}

export function handleSummary(data) {
    return {
      "Reports/currency-identifiers.html": htmlReport(data),
       stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}