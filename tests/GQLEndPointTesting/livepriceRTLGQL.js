import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group, fail } from 'k6';
import { SharedArray } from 'k6/data';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";


var livePriceRTLRespTime = new Trend("custom_livePriceQuality_response_time");
var delayedPriceRespTime = new Trend("custom_delayedPrice_response_time");

export const options = {
    stages: [
        { duration: '1m', target: 8 },  
        // { duration: '26m', target: 20 }, 
        // { duration: '2m', target: 0 }, 
    ],
    thresholds: {
        http_req_failed: ['rate<0.01'], // http errors should be less than 1%
        http_req_duration: ['p(95)<1000'], // 95% of requests should be below 1s
       },
};
    const headers = JSON.parse(open("../../data/headers.json"));

    export default function () {
    
    if (__ENV.ENDPOINT === undefined) {
        fail("Environment: ENDPOINT must be set");
    } 
    
    var res; 
        group('Live Price for Instruments in UTC', function () {
            const query = `query {
              quotes(identifiers: ["NASDAQ:NBIS", "FUND:BN0S2V9", "FUND:B7W3061", "EURONEXT:HEIA", "LSE:VOD", "NASDAQ:MSFT","NYSE:NKE", "XETRA:DTE", "XMAD:TEF"]) {
              name
              priceQuality
              dayChange           
              }
            }`;
      
              res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
                headers: headers.header2,
              });
      
              var body = JSON.parse(res.body);
              const names = [
                "Nebius Group N.V.",
                "Heineken NV",
                "Microsoft Corp",
                "Nike",
                "Deutsche Telekom AG",
                "Telefonica SA"
              ];

              check(res, {
                'is status 200': (r) => r.status === 200,
              });

              body.data.quotes.forEach((quote) => {
                check(quote.name, {
                  'is name valid': (name) => names.includes(name),
                });
                check(quote.priceQuality, {
                  'is Price quality Realtime': (value) => value === "RTL"
                });
                check(quote.dayChange, {
                  'dayChange is not null': (change) => Number.isFinite(parseFloat(change))
                });
              });
           
              livePriceRTLRespTime.add(res.timings.duration);
        });
  
}
export function handleSummary(data) {
    return {
      "GQLReports/LivePricesRTL.html": htmlReport(data),
       stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}