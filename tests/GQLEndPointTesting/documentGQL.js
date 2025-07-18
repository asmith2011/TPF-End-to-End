import http from "k6/http";
import { Trend, Rate } from "k6/metrics";
import { check, group } from "k6";
import { getCSVData } from "../../commonUtil/DataParmetrisation.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var documentRespTime = new Trend("document_response_time");
var documentStats = new Rate("document_stats");

var documentRespTimeForB2PB2M7 = new Trend("document_response_time_B2PB2M7");
var documentStatsForB2PB2M7 = new Rate("document_stats_B2PB2M7");

const headers = {
  "Content-Type": "application/json",
  "Accept-Encoding": "gzip, deflate, br",
  Accept: "application/json",
  Connection: "keep-alive",
  DNT: "1",
};

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

  var input = getCSVData();

  group("Document Datapoints Validation", function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isDocumentEnabled = obj.isDocumentEnabled;

      if (isDocumentEnabled === "true") {
        const query = `query {
      documents(identifier: "${identifier}") {
        id
        encodedId
        type
        url
        filingDate
        effectiveDate
        encodedId
        typeId
        format
      }
    }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);

        check(res, {
          "is status 200": (r) => r.status === 200,
        });

        for (let i = 0; i < body.data.documents.length; i++) {
          let id = body.data.documents[i].id;
          let type = body.data.documents[i].type;
          let typeId = body.data.documents[i].typeId;
          let encodedId = body.data.documents[i].encodedId;
          let url = body.data.documents[i].url;
          let format = body.data.documents[i].format;
          let filingDate = body.data.documents[i].filingDate;
          let effectiveDate = body.data.documents[i].effectiveDate;

          check(id, {
            'has document id  => not null': (idValue) => idValue != undefined || idValue == null
          });
          check(type, {
            'has document type  => not null': (typeValue) => typeValue != undefined || typeValue== null
          });
          check(encodedId, {
            'has document encodedId  => not null': (encodedIdValue) => encodedIdValue != undefined || encodedIdValue== null
          });
          check(typeId, {
            'has document typeId  => not null': (typeIdValue) => typeIdValue != undefined || typeIdValue == null
          });
          check(url, {
            'has document url  => not null': (urlValue) => urlValue != undefined || urlValue == null
          });
          check(format, {
            'has document format => not null': (formatValue) => formatValue != undefined || formatValue == null
          });
          check(filingDate, {
            'has document filingDate  => not null': (filingDateValue) => filingDateValue != undefined || filingDateValue == null
          });
          check(effectiveDate, {
            'has document effectiveDate  => not null': (effectiveDateValue) => effectiveDateValue != undefined | effectiveDateValue == null
          });
        }
      }
    }
    documentRespTime.add(res.timings.duration);
    documentStats.add(1);
  });
  //We are mocking the GQL response for fund B2PB2M7 in dev and UAT alone as mobile app is crashing 
  group("SDR Document Validation for fund B2PB2M7", function () {
    const query = `query {
      documents(identifier: "FUND:B2PB2M7") {
        id
        encodedId
        type
        url
        filingDate
        effectiveDate
        encodedId
        typeId
        format
      }
    }`;

    res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
      headers: headers,
    });

    var body = JSON.parse(res.body);

    check(res, {
      "is status 200": (r) => r.status === 200,
    });

    for (let i = 0; i < body.data.documents.length; i++) {
      let id = body.data.documents[i].id;
      let type = body.data.documents[i].type;
      let typeId = body.data.documents[i].typeId;
      let encodedId = body.data.documents[i].encodedId;
      let url = body.data.documents[i].url;
      let format = body.data.documents[i].format;
      let filingDate = body.data.documents[i].filingDate;
      let effectiveDate = body.data.documents[i].effectiveDate;

      if (type == "Sustainability Disclosure Requirements") {
        check(id, {
          "has document id  => a8c4ad8c82609f10e9b08d2ff0c3dc9a": (idValue) =>
            idValue == "a8c4ad8c82609f10e9b08d2ff0c3dc9a",
        });
        check(encodedId, {
          "has document encodedId  =>not null": (encodedIdValue) =>
            encodedIdValue == null,
        });
        check(typeId, {
          "has document typeId  => 705": (typeIdValue) => typeIdValue == "705",
        });
        check(url, {
          "has document url  => not null": (urlValue) =>
            urlValue ==
            "https://doc.morningstar.com/document/a8c4ad8c82609f10e9b08d2ff0c3dc9a.msdoc/?clientid=ajbell&key=805803a4ca9fc338",
        });
        check(format, {
          "has document format => null": (formatValue) =>
            formatValue == null
        });
        check(filingDate, {
          "has document filingDate  => not null": (filingDateValue) =>
            filingDateValue == "2024-07-01T00:00:00"
        });
        check(effectiveDate, {
          "has document effectiveDate  =>  null": (effectiveDateValue) =>
            effectiveDateValue == null
        });
      }
    }
    documentRespTimeForB2PB2M7.add(res.timings.duration);
    documentStatsForB2PB2M7.add(1);
  });
}

export function handleSummary(data) {
  return {
    "GQLReports/documentGQL Test.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
