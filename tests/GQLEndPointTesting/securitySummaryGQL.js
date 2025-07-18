import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
import { SharedArray } from 'k6/data';

var securitySummaryRespTime = new Trend("securitySummary_response_time");
var securitySummaryStats = new Rate("securitySummary_stats");

const headers = JSON.parse(open("../../data/headers.json"));

var res;
export const options = {
  stages: [
      { duration: '1m', target: 8 },  
      // { duration: '26m', target: 20 }, 
      // { duration: '2m', target: 0 }, 
  ],
  thresholds: {
      http_req_failed: ['rate<0.01'], // http errors should be less than 1%
      http_req_duration: ['p(95)<900'], // 95% of requests should be below 900ms
     },
};
  const securitySummary = new SharedArray('List of Instruments', function () {
      return JSON.parse(open("../../data/testData.json")).securitySummary;
  });

  export default function () {
  
  if (__ENV.ENDPOINT === undefined) {
      fail("Environment: ENDPOINT must be set");
  } 
  
  var res;
  securitySummary.forEach(function(sym){    
      group('Security Summary of instruments', function () {
          const query = `query {
            securitySummary(marketCode: "${sym}") {
              marketCode
              dateCreated
              financialPerformance
              focus
              industry
              mediumTermOutlook
              opportunities
              overallComparison
              relevantCompaniesMarketCode
              relevantCompaniesNames
              sector
              threats
              title
              trends
              valuation
            }
          }`;
    
            res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
              headers: headers.header2,
            });
    
            var body = JSON.parse(res.body);
            // console.log(body)

            check(res, {
              'is status 200': (r) => r.status === 200,
            });
            check(body.data.securitySummary.marketCode, {
              'is marketcode correct': (marketCode) => marketCode === `${sym}`
            });
            check(body.data.securitySummary.financialPerformance, {
              'is financialPerformance available': (financialPerformance) => financialPerformance.length>5
            });
            check(body.data.securitySummary.focus, {
              'is focus available': (focus) => focus.length>5
            });
            check(body.data.securitySummary.industry, {
              'is industry available': (industry) => industry.length>5
            });
            check(body.data.securitySummary.opportunities, {
              'is opportunities available': (opportunities) => opportunities.length>1
            });
            check(body.data.securitySummary.threats, {
              'is threats available': (threats) => threats.length>1
            });
            check(body.data.securitySummary.trends, {
              'is trends available': (trends) => trends.length>1
            });
            check(body.data.securitySummary.valuation, {
              'is valuation available': (valuation) => valuation.length>5
            });
            
            securitySummaryRespTime.add(res.timings.duration);
      });
  }) 
}

export function handleSummary(data) {
  return {
    "GQLReports/securitySummary.html": htmlReport(data),
     stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
