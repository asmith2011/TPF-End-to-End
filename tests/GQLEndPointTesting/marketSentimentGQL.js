import http from "k6/http";
import { Trend, Rate } from "k6/metrics";
import { check, group } from "k6";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
import {
  expect,
} from "https://jslib.k6.io/k6chaijs/4.3.4.3/index.js";
var elasticResponse;
var mongoResponse;

const headers = JSON.parse(open("../../data/headers.json"));

var res;

export const options = {
  thresholds: {
    checks: ["rate>=1"],
  },
};

export default function () {
  if (__ENV.ENDPOINT === undefined) {
    fail("Environment: ENDPOINT must be set");
  }

  group(
    "Test marker sentiment from Elastic search",
    function () {
      var query = ` query {
            marketSentiment(
              dbSource:Elasticsearch
                startDate: "01/01/2025",
                endDate: "31/01/2025",
                sourceCode: ALLIANCE) {
                    positivePercentage
                    negativePercentage
            }
        }`;

      res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
        headers: headers.header1,
      });

      elasticResponse = JSON.parse(res.body);

      check(res, {
        "is status 200": (r) => r.status === 200,
      });
    }
  );
  group(
    "Test marketSentiment-api from Mongo",
    function () {
      var query = ` query {
            marketSentiment(
              dbSource:Mongo,
                startDate: "10/07/2024",
                endDate: "25/07/2024",
                sourceCode: ALLIANCE) {
                    positivePercentage
                    negativePercentage
            }
        }`;

      res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
        headers: headers.header1,
      });

      mongoResponse = JSON.parse(res.body);

      check(res, {
        "is status 200": (r) => r.status === 200,
      });
    }
  );

  group(
    "compare",
    function () {
      expect(JSON.stringify(elasticResponse)).to.equal(JSON.stringify(mongoResponse))
    }
  );
}

export function handleSummary(data) {
  return {
    "GQLReports/marketSentimentCompareGQL Test.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
