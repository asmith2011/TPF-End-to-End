import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group } from 'k6';
import { getCSVData } from "../../commonUtil/DataParmetrisation.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var ratingsRespTime = new Trend("ratings_response_time");
var ratingsStats = new Rate("ratings_stats");
var morningStarratingsRespTime = new Trend("morningStarratings_response_time");
var morningStarratingsStats = new Rate("morningStarratings_stats");

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

  group('Ratings  Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isRatingsFundEnabled = obj.isRatingsFund;
      var isRatingsETFEnabled = obj.isRatingsETF;

      if (isRatingsFundEnabled === 'true' || isRatingsETFEnabled === 'true') {
        const query = `query {
      ratings(identifier: "${identifier}") {
        riskStatistics{
          alpha
          beta
          rSquared
          period
          }
          SRRI
      }
    }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers.header1,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        for (let i = 0; i < body.data.ratings.riskStatistics.length; i++) {
          let period = body.data.ratings.riskStatistics[i].period;

          if (period == "36m") {
            check(body.data.ratings.riskStatistics[i].alpha, {
              'has alpha not undefined': (alphaValue) => alphaValue != undefined
            });

            check(body.data.ratings.riskStatistics[i].beta, {
              'has beta not undefined': (betaValue) => betaValue != undefined
            });

            check(body.data.ratings.riskStatistics[i].rSquared, {
              'has rSquared not undefined': (rSquaredValue) => rSquaredValue != undefined
            });
          }
        }

        check(body.data.ratings.SRRI, {
          'has SRRI not undefined': (SRRIValue) => SRRIValue !== undefined
        });
      }
    }
    ratingsRespTime.add(res.timings.duration);
    ratingsStats.add(1);
  });

  group('Morningstar Analyst Rating', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var labels = ["Bronze","Silver","Gold","Negative","Neutral",]

        const query = `query {
          ratings(identifier: "${identifier}")  {
              analystRating
              analystRatingLabel
              analystDrivenPercentage
              analystRatingDate
            }
    }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers.header1,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        check(body.data.ratings.analystRating, {
          'has rating between 1 to 10': (rating) => rating > 0 && rating < 11
        });

        check(body.data.ratings.analystRatingLabel, {
          'has rating label is valid': (ratingLabel) => labels.includes(ratingLabel)
        });

        check(body.data.ratings.analystDrivenPercentage, {
          'has percent is valid': (percent) => percent >= 0 && percent < 101
        });

        check(body.data.ratings.analystRatingDate, {
          'has rating date is valid': (date) => Date.parse(date) != NaN
        });
      
    }
    morningStarratingsRespTime.add(res.timings.duration);
    morningStarratingsStats.add(1);
  });
}

export function handleSummary(data) {
  return {
    "GQLReports/ratingsGQL Test.html": htmlReport(data),
     stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}