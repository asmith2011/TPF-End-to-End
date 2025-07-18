import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group } from 'k6';
import { getCSVData } from "../../commonUtil/DataParmetrisation.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var profileCEFRespTime = new Trend("profileCEF_response_time");
var profileCEFStats = new Rate("profileCEF_stats");

var profileFundRespTime = new Trend("profileFund_response_time");
var profileFundStats = new Rate("profileFund_stats");

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

  group('Profile CEF Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isProfileCEFEnabled = obj.isProfileCEF;

      if (isProfileCEFEnabled === 'true') {
        const query = `query {
      profile(identifier: "${identifier}") {
        ...on ProfileCEF {
          nextAGMDate
          navFrequency
          inceptionDate
          legalStructure
          domicile
          financialYearEnd
          }
      }
    }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers.header1,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        check(body.data.profile.navFrequency, {
          'has navFrequency': (value) => value != "" && value != null && value != undefined
        });
        check(body.data.profile.nextAGMDate, {
          'has nextAGMDate': (value) => /^(19|20)\d{2}\-(0[1-9]|1[0-2])\-(0[1-9]|1\d|2\d|3[01])\T[0-5][0-9]\:[0-5][0-9]\:[0-5][0-9]$/.test(value) == true
        });
        check(body.data.profile.inceptionDate, {
          'has inceptionDate': (value) => value != "" && value != null && value != undefined
        });
        check(body.data.profile.legalStructure, {
          'has legalStructure': (value) => value != "" && value != null && value != undefined
        });
        check(body.data.profile.domicile, {
          'has domicile': (value) => value != "" && value != null && value != undefined
        });
        check(body.data.profile.financialYearEnd, {
          'has financialYearEnd': (value) => value != "" || value == null || value != undefined
        });
      }
    }
    profileCEFRespTime.add(res.timings.duration);
    profileCEFStats.add(1);
  });
  group('Profile Fund Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isProfileFundEnabled = obj.isProfileFund;

      if (isProfileFundEnabled === 'true') {

        const query = `query {
          profile(identifier: "${identifier}") {
            ...on ProfileFund {
              legalStructure
              name
              }
          }
        }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers.header1,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        check(body.data.profile.legalStructure, {
          'has legalStructure => not null': (value) => value != "" && value != null
        });
      }
    }
    profileFundRespTime.add(res.timings.duration);
    profileFundStats.add(1);
  });
}


export function handleSummary(data) {
  return {
    "GQLReports/profileGQL Test.html": htmlReport(data),
     stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}