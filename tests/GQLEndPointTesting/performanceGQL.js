import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group } from 'k6';
import { getCSVData } from "../../commonUtil/DataParmetrisation.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var performanceRespTime = new Trend("performance_response_time");
var performanceStats = new Rate("performance_stats");

var performanceEquityRespTime = new Trend("performanceEquity_response_time");
var performanceEquityStats = new Rate("performanceEquity_stats");

const headers = {
  'Content-Type': 'application/json',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept': 'application/json',
  'Connection': 'keep-alive',
  'DNT': '1'
};

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

  group('Performance Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isPerformanceFundEnabled = obj.isPerformanceFund;
      var isPerformanceETFEnabled = obj.isPerformanceETF;
      var isPerformanceCEFEnabled = obj.isPerformanceCEF;
      var isPerformanceEquityEnabled = obj.isPerformanceEquity;

      if (isPerformanceCEFEnabled === 'true' || isPerformanceFundEnabled === 'true' || isPerformanceETFEnabled === 'true' || isPerformanceEquityEnabled === 'true') {

        const query = `query {
      performance(identifier: "${identifier}") {
        benchmarkPerformance1D
        benchmarkPerformance1M
        benchmarkPerformance3M
        benchmarkPerformance1Y
        benchmarkPerformance3Y
        benchmarkPerformance5Y
        benchmarkPerformance10Y

        performance1D
        performance1M
        performance3M
        performance1Y
        performance3Y
        performance5Y
        performance10Y
      } }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);
        console.log('EXAMPLE & response')
        console.log(JSON.stringify(input[i]))
        console.log(body)

        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        check(body.data.performance.benchmarkPerformance1D, {
          'has benchmarkPerformance1D': (value) => value !== undefined
        });

        check(body.data.performance.benchmarkPerformance1M, {
          'has benchmarkPerformance1M': (value) => value !== undefined
        });

        check(body.data.performance.benchmarkPerformance3M, {
          'has benchmarkPerformance3M': (value) => value !== undefined
        });

        check(body.data.performance.benchmarkPerformance1Y, {
          'has benchmarkPerformance1Y': (value) => value !== undefined
        });

        check(body.data.performance.benchmarkPerformance3Y, {
          'has benchmarkPerformance3Y': (value) => value !== undefined
        });

        check(body.data.performance.benchmarkPerformance5Y, {
          'has benchmarkPerformance5Y': (value) => value !== undefined
        });

        check(body.data.performance.benchmarkPerformance10Y, {
          'has benchmarkPerformance10Y': (value) => value !== undefined
        });

        check(body.data.performance.performance1D, {
          'has performance1D': (value) => value !== undefined
        });

        check(body.data.performance.performance1M, {
          'has performance1M': (value) => value !== undefined || value==null
        });

        check(body.data.performance.performance3M, {
          'has performance3M': (value) => value !== undefined || value==null
        });

        check(body.data.performance.performance1Y, {
          'has performance1Y': (value) => value !== undefined || value==null
        });

        check(body.data.performance.performance3Y, {
          'has performance3Y': (value) => value !== undefined || value==null
        });

        check(body.data.performance.performance5Y, {
          'has performance5Y': (value) => value !== undefined || value==null
        });

        check(body.data.performance.performance10Y, {
          'has performance10Y': (value) => value !== undefined || value==null
        });
      }
      if (isPerformanceCEFEnabled === 'true' || isPerformanceFundEnabled === 'true' || isPerformanceETFEnabled === 'true') {
        const query = `query {
      performance(identifier: "${identifier}") {
        benchmarks{
          type
          name
        } 
        benchmarkPerformance6M
        performance6M
      } }`;
        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });


        check(body.data.performance.benchmarks[0].type, {
          'has benchmarks type': (value) => value != undefined
        });

        check(body.data.performance.benchmarks[0].name, {
          'has benchmarks name': (value) => value != undefined && value != "" && value != null
        });

        check(body.data.performance.benchmarkPerformance6M, {
          'has benchmarkPerformance6M': (value) => value !== undefined
        });

        check(body.data.performance.performance6M, {
          'has performance6M': (value) => value !== undefined
        });
      }
      if (isPerformanceEquityEnabled === 'true') {
        const query = `query {
      performance(identifier: "${identifier}") {
        benchmarkId
        benchmarkName
      } }`;
        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        check(body.data.performance.benchmarkId, {
          'has benchmarkId': (value) => value !== undefined || value === null
        });

        check(body.data.performance.benchmarkName, {
          'has benchmarkName': (value) => value !== undefined || value === null
        });
      }
    }
    performanceRespTime.add(res.timings.duration);
    performanceStats.add(1);
  });
  group('performanceYTD Equity Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isPerformanceEquityEnabled = obj.isPerformanceEquity;

      if (isPerformanceEquityEnabled === 'true') {
        const query = `query {
      performance(identifier: "${identifier}") {
        performanceYTD
      } }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        check(body.data.performance.performanceYTD, {
          'has performanceYTD': (value) => value !== "" && value !== undefined
        });
      }
    }
    performanceEquityRespTime.add(res.timings.duration);
    performanceEquityStats.add(1);
  });
}


export function handleSummary(data) {
  return {
    "GQLReports/performanceGQL Test.html": htmlReport(data),
     stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}