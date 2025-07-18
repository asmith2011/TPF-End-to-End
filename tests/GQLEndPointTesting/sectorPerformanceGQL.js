import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var sectorPerformanceRespTime = new Trend("sectorPerformance_response_time");
var sectorPerformanceStats = new Rate("sectorPerformance_stats");

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


  group('Sector Performance Datapoints Validation', function () {

      const query = `query {
        sectorPerformance {
          name
          todayPrice
          todayChange
          todayChangePct
          oneWeekPrice
          oneWeekChange
          oneWeekChangePct
          oneMonthPrice
          oneMonthChange
          oneMonthChangePct
          threeMonthPrice
          threeMonthChange
          threeMonthChangePct
          sixMonthPrice
          sixMonthChange
          sixMonthChangePct
          oneYearPrice
          oneYearChange
          oneYearChangePct
          yearToDatePrice
          yearToDateChange
          yearToDateChangePct
        }
      }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers.header1,
        });

        var body = JSON.parse(res.body);

        for (let i = 0; i < body.data.sectorPerformance.length; i++) {
        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        check(body.data.sectorPerformance[0].todayPrice, {
          'has todayPrice type number': (value) => typeof value === 'number' && value!=null && value!=""
        });

        check(body.data.sectorPerformance[0].todayChange, {
          'has todayChange type number': (value) => typeof value === 'number' && value!=null && value!=""
        });

        check(body.data.sectorPerformance[0].todayChangePct, {
          'has todayChangePct type number': (value) => typeof value === 'number' && value!=null && value!=""
        });

        check(body.data.sectorPerformance[0].oneWeekPrice, {
          'has oneWeekPrice type number': (value) => typeof value === 'number' && value!=null && value!=""
        });

        check(body.data.sectorPerformance[0].oneWeekChange, {
          'has oneWeekChange type number': (value) => typeof value === 'number' && value!=null && value!=""
        });

        check(body.data.sectorPerformance[0].oneWeekChangePct, {
          'has oneWeekChangePct type number': (value) => typeof value === 'number' && value!=null && value!=""
        });

        check(body.data.sectorPerformance[0].oneMonthPrice, {
          'has oneMonthPrice type number': (value) => typeof value === 'number' && value!=null && value!=""
        });

        check(body.data.sectorPerformance[0].oneMonthChange, {
          'has oneMonthChange type number': (value) => typeof value === 'number' && value!=null && value!=""
        });

        check(body.data.sectorPerformance[0].oneMonthChangePct, {
          'has oneMonthChangePct type number': (value) => typeof value === 'number' && value!=null && value!=""
        });

        check(body.data.sectorPerformance[0].threeMonthPrice, {
          'has threeMonthPrice type number': (value) => typeof value === 'number' && value!=null && value!=""
        });

        check(body.data.sectorPerformance[0].threeMonthChange, {
          'has threeMonthChange type number': (value) => typeof value === 'number' && value!=null && value!=""
        });

        check(body.data.sectorPerformance[0].threeMonthChangePct, {
          'has threeMonthChangePct type number': (value) => typeof value === 'number' && value!=null && value!=""
        });

        check(body.data.sectorPerformance[0].sixMonthPrice, {
          'has sixMonthPrice type number': (value) => typeof value === 'number' && value!=null && value!=""
        });

        check(body.data.sectorPerformance[0].sixMonthChange, {
          'has sixMonthChange type number': (value) => typeof value === 'number' && value!=null && value!=""
        });

        check(body.data.sectorPerformance[0].sixMonthChangePct, {
          'has sixMonthChangePct type number': (value) => typeof value === 'number' && value!=null && value!=""
        });

        check(body.data.sectorPerformance[0].oneYearPrice, {
          'has oneYearPrice type number': (value) => typeof value === 'number' && value!=null && value!=""
        });
        check(body.data.sectorPerformance[0].oneYearChange, {
          'has oneYearChange type number': (value) => typeof value === 'number' && value!=null && value!=""
        });

        check(body.data.sectorPerformance[0].oneYearChangePct, {
          'has oneYearChangePct type number': (value) => typeof value === 'number' && value!=null && value!=""
        });

        check(body.data.sectorPerformance[0].yearToDatePrice, {
          'has yearToDatePrice type number': (value) => typeof value === 'number' && value!=null && value!=""
        });

        check(body.data.sectorPerformance[0].yearToDateChange, {
          'has yearToDateChange type number': (value) => typeof value === 'number' && value!=null && value!=""
        });

        check(body.data.sectorPerformance[0].yearToDateChangePct, {
          'has yearToDateChangePct type number': (value) => typeof value === 'number' && value!=null && value!=""
        });
      }
      
    sectorPerformanceRespTime.add(res.timings.duration);
    sectorPerformanceStats.add(1);
  });
}

export function handleSummary(data) {
  return {
    "GQLReports/sectorPerformanceGQL Test.html": htmlReport(data),
     stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}