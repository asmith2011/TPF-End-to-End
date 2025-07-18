import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group } from 'k6';
import { getCSVData } from "../../commonUtil/DataParmetrisation.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var keyStatisticsCEFRespTime = new Trend("keyStatisticsCEF_response_time");
var keyStatisticsCEFStats = new Rate("keyStatisticsCEF_stats");

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

  group('Key Statistics Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isKeyStatisticsCEFEnabled = obj.isKeyStatisticsCEF;

      if (isKeyStatisticsCEFEnabled === 'true') {
        const query = `query {
      keyStatistics(identifier: "${identifier}") {
          grossGearing 
          netGearing
          netAssets
          totalAssets
          zStatistic
          averageDiscountM12
      }
    }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers.header1,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        check(body.data.keyStatistics.grossGearing, {
          'has grossGearing': (value) => value !== undefined
        });

        check(body.data.keyStatistics.netGearing, {
          'has netGearing': (value) => value !== undefined
        });

        check(body.data.keyStatistics.netAssets, {
          'has netAssets': (value) => value !== undefined
        });

        check(body.data.keyStatistics.totalAssets, {
          'has totalAssets': (value) => value !== undefined
        });

        check(body.data.keyStatistics.zStatistic, {
          'has zStatistic': (value) => value !== undefined
        });

        check(body.data.keyStatistics.averageDiscountM12, {
          'has averageDiscountM12': (value) => value !== undefined
        });
      }
    }
    keyStatisticsCEFRespTime.add(res.timings.duration);
    keyStatisticsCEFStats.add(1);
  });
}

export function handleSummary(data) {
  return {
    "GQLReports/keyStatisticsGQL Test.html": htmlReport(data),
     stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
