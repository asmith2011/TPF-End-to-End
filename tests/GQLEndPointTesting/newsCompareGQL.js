import http from "k6/http";
import { Trend, Rate } from "k6/metrics";
import { check, group } from "k6";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
import {
  describe,
  expect,
} from "https://jslib.k6.io/k6chaijs/4.3.4.3/index.js";
var elasticResponse;
var mongoResponse;
var newsOpensearchResptime = new Trend("news_opensearch_response_time");
var newsOpensearchStats = new Trend("news_opensearch_stats");
var newsMongoatlasResptime = new Trend("news_mongoatlas_response_time");
var newsMongoatlasStats = new Trend("news_mongoatlas_stats");

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
    "Test news-api from Elastic search",
    function () {
      var query = `query {
              newsHeadlines(
                limit:50, 
                dbSource:Elasticsearch,
              ){
                headlines {
                  id
                  symbols
                  title
                  titleShort
                  symbols
                  typeCode
                  type
                  dateTime
                  id
                  sourceCode
                  source
                  provider
                  tags
                  timestamp
                  searchScore
                }
              }
            }`;

      res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
        headers: headers.header1,
      });

      elasticResponse = JSON.parse(res.body);

      check(res, {
        "is status 200": (r) => r.status === 200,
      });

      newsOpensearchResptime.add(res.timings.duration);
      newsOpensearchStats.add(1);
    }
  );
  group(
    "Test news-api from Mongo",
    function () {
      var query = `query {
              newsHeadlines(
                limit:50, 
                dbSource:Mongo,
              ){
                headlines {
                  id
                  symbols
                  title
                  titleShort
                  symbols
                  typeCode
                  type
                  dateTime
                  id
                  sourceCode
                  source
                  provider
                  tags
                  timestamp
                  searchScore
                }
              }
            }`;

      res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
        headers: headers.header1,
      });

      mongoResponse = JSON.parse(res.body);

      check(res, {
        "is status 200": (r) => r.status === 200,
      });

      newsMongoatlasResptime.add(res.timings.duration);
      newsMongoatlasStats.add(1);
    }
  );
  group(
    "Compare responses from Elastic & Mongo",
    function () {
      expect(JSON.stringify(elasticResponse)).to.not.equal(JSON.stringify(mongoResponse))
      const timestampKeys = ['timestamp'];
      var compareResult = areEqualIgnoringTimestamps(elasticResponse, mongoResponse, timestampKeys);
      console.log('**Response from 2 sources should match after removing the Timestamps**');
      expect(compareResult).to.be.true;
    }
  );


}

export function handleSummary(data) {
  return {
    "GQLReports/newsCompareGQL Test.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}

function areEqualIgnoringTimestamps(response1, response2, timestampKeys) {
  const cleanResponse1 = removeTimestamps(response1, timestampKeys);
  const cleanResponse2 = removeTimestamps(response2, timestampKeys);
  return JSON.stringify(cleanResponse1) === JSON.stringify(cleanResponse2);
}

function removeTimestamps(obj, timestampKeys) {
  if (Array.isArray(obj)) {
    return obj.map((item) => removeTimestamps(item, timestampKeys));
  } else if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).reduce((acc, key) => {
      if (!timestampKeys.includes(key)) {
        acc[key] = removeTimestamps(obj[key], timestampKeys);
      }
      return acc;
    }, {});
  }
  return obj;
}
