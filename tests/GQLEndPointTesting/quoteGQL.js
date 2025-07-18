import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group } from 'k6';
import { getCSVData } from "../../commonUtil/DataParmetrisation.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var quoteRespTime = new Trend("quote_response_time");
var quoteStats = new Rate("quote_stats");

var quotesRespTime = new Trend("quotes_response_time");
var quotesStats = new Rate("quotes_stats");

var etfquoteRespTime = new Trend("etfquote_response_time");
var etfquoteReturnStats = new Rate("etfquote_stats");

var fundquoteRespTime = new Trend("fundquote_response_time");
var fundquoteReturnStats = new Rate("fundquote_stats");

var quoteCEFRespTime = new Trend("quoteCEF_response_time");
var quoteCEFStats = new Rate("quoteCEF_stats");

const headers = JSON.parse(open("../../data/headers.json"));

const codes = JSON.parse(open("../../data/marketcodes.json"));


var res;
const instruments = JSON.parse(open("../../data/testData.json")).instrumentAllExchanges;
const sedols = JSON.parse(open("../../data/testData.json")).sedols;

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

  group('Quote Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      let identifier = obj.Name;
      var isGeneralQuoteEnabled = obj.IsGeneralQuote;
      var type=obj.Type;
      let instrumentName=JSON.stringify(identifier);
      let instrument=instrumentName.replace(/['"]+/g, '')

      if (isGeneralQuoteEnabled === 'true') {
        const query = `query {
      quote(identifier: "${identifier}") {
            name
            currency
            dayChange
            dayChangePct
            isInternational
            supportedOrderTypes
            marketCode
      }
    }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers.header1,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        check(body.data.quote.name, {
          'has name  => not null': (value) => value != undefined && value != null
        });

        check(body.data.quote.dayChange, {
          'has dayChange  => not null': (value) => value != undefined && value != null
        });

        check(body.data.quote.dayChangePct, {
          'has dayChangePct  => not null': (value) => value != undefined && value != null
        });
        if(instrument.startsWith('LSE') || instrument.startsWith('FUND'))
        {
        check(body.data.quote.isInternational, {
          'has isInternational  => not null': (value) => value === false
        });
        }
        else{
          check(body.data.quote.isInternational, {
            'has isInternational  => not null': (value) => value === true
          });
        }
        check(body.data.quote.marketCode, {
          'has marketCode  => not null': (value) => value != undefined && value != null
        });

        for (let i = 0; i < body.data.quote.supportedOrderTypes.length; i++) {
          if(body.data.quote.supportedOrderTypes[i]=='MKT')
          {
              check(body.data.quote.supportedOrderTypes[i], {
                  'has supportedOrderTypes': (value) => value === 'MKT' 
              });
          }
          if((type!=='Fund' && type!=='IPO' )&& (body.data.quote.currency==='GBX'|| body.data.quote.currency==='GBP'))
          {
            if(body.data.quote.supportedOrderTypes[i]=='STO')
          {
              check(body.data.quote.supportedOrderTypes[i], {
                  'has supportedOrderTypes': (value) => value === 'STO' 
              });
          }
          }
          if((type!=='Fund' && type!=='IPO' )&& ((body.data.quote.currency==='GBX'|| body.data.quote.currency==='GBP')||body.data.quote.isInternational===true))
          {
            if(body.data.quote.supportedOrderTypes[i]=='LIM')
            {
              check(body.data.quote.supportedOrderTypes[i], {
                  'has supportedOrderTypes': (value) => value === 'LIM' 
              });
            }
          }
        }
      }
    }
    quoteRespTime.add(res.timings.duration);
    quoteStats.add(1);
  });

  group('Quotes Forex Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      let identifier = obj.Name;
      var isForExEnabled = obj.IsForExEnabled;

      if (isForExEnabled === 'true') {
        const query = `query {
      quotes(identifiers: "${identifier}") {
            marketCode
            midPrice
      }
      }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers.header1,
        });

        var body = JSON.parse(res.body);
        check(res, {
          'is status 200': (r) => r.status === 200,
        });
        check(body.data.quotes[0].marketCode, {
          'has marketCode  => not null': (value) => value != undefined && value != null && value != ""
        });
        check(body.data.quotes[0].midPrice, {
          'has midPrice  => not null': (value) => value != undefined || value == null || value != ""
        });
      }
    }
    quoteRespTime.add(res.timings.duration);
    quoteStats.add(1);
  });

  group('Quote Funds Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isFundQuoteEnabled = obj.isQuoteFund;

      if (isFundQuoteEnabled === 'true') {
        const query = `query {
      quote(identifier: "${identifier}") {
            ...on Fund {
              instrumentStructure
              dealingCutOffTime
              incomeFrequency
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

        check(body.data.quote.instrumentStructure, {
          'has instrumentStructure  => not null': (value) => value != "" && value != null
        });

        check(body.data.quote.dealingCutOffTime, {
          'is dealingCutOffTime not null': (t) => t != "" 
        });
        if(body.data.quote.dealingCutOffTime!=null)
        {
          /\b(?:[01]?\d|2[0-3]):[0-5]?\d:[0-5]?\d\b/.test(body.data.quote.dealingCutOffTime) == true
        }
        check(body.data.quote.incomeFrequency, {
          'has incomeFrequency  => not null': (value) => value === "Annually" || value === "Semi-annually" || value === "Quarterly" || value === "Monthly" || value===null
        });
      }
    }
    fundquoteRespTime.add(res.timings.duration);
    fundquoteReturnStats.add(1);
  });

  group('Quote ETF Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isQuoteETFEnabled = obj.isQuoteETF;

      if (isQuoteETFEnabled === 'true') {
        const query = `query {
        quote(identifier: "${identifier}") {
            ...on ETF {  
                yield
                replicationMethod
                incomeFrequency
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

        if (body.data.quote.yield !== null) {
          check(body.data.quote.yield, {
            'has yield': (value) => value !== undefined && value !== ""
          });
        }
        check(body.data.quote.replicationMethod, {
          'has replicationMethod': (value) => value !== "" && value !== null && value !== undefined
        });
        check(body.data.quote.incomeFrequency, {
          'has incomeFrequency  => not null': (value) => value === "Annually" || value === "Semi-annually" || value === "Quarterly" || value === "Monthly" || value===null
        });
      }
    }
    etfquoteRespTime.add(res.timings.duration);
    etfquoteReturnStats.add(1);
  });

  group('Quote CEF Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isQuoteCEFEnabled = obj.isQuoteCEF;

      if (isQuoteCEFEnabled === 'true') {
        const query = `query {
      quote(identifier: "${identifier}") {
        ...on CEF {
          yearHighNav
          yearLowNav
          calendarYearHigh
          calendarYearLow
          discountYearHigh
          discountYearLow
          sharesInIssue
          currency
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

        check(body.data.quote.yearHighNav, {
          'has yearHighNav  => not null': (value) => value != "" && value != null
        });

        check(body.data.quote.yearLowNav, {
          'has yearLowNav  => not null': (value) => value != "" && value != null
        });

        check(body.data.quote.calendarYearHigh, {
          'has calendarYearHigh  => not null': (value) => value != "" && value != null
        });

        check(body.data.quote.calendarYearLow, {
          'has calendarYearLow  => not null': (value) => value != "" && value != null
        });

        check(body.data.quote.discountYearHigh, {
          'has discountYearHigh': (value) => value != "" && value != undefined || value =='0' || value != null 
        });

        check(body.data.quote.discountYearLow, {
          'has discountYearLow  => not null': (value) => value != "" && value != null
        });

        check(body.data.quote.sharesInIssue, {
          'has sharesInIssue': (value) => value != "" || value == null || value != undefined
        });

        check(body.data.quote.currency, {
          'has currency => not null': (value) => value != "" && value != null && value != undefined
        });
      }
    }
    quoteCEFRespTime.add(res.timings.duration);
    quoteCEFStats.add(1);
  });

  group('Query using Sedols validation code', function () {
      for (var i = 0; i < input.length; i++) {
                const obj = JSON.parse(JSON.stringify(input[i]));
        let sedolVal = obj.Sedol
        if (sedolVal !== "null") {
          const query = `query {
            quotes(sedols: [ "${sedolVal}" ]) {
              name
              marketCode
        }
      }`;

      res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
        headers: headers.header1,
      });

      var body = JSON.parse(res.body);

      check(res, {
        'is status 200': (r) => r.status === 200,
      });

      check(body.data.quotes[0].marketCode , {
        'returns correct name': (code) => code.includes(obj.Name)
      });
    }
  }
  });

  group('Query using Sedols from MongoDB for non UK Stocks', function () {
    console.log(JSON.stringify(sedols))
          const query = `query {
            quotes(sedols: ${JSON.stringify(sedols)}) {
            name
            sedol
            currency
            dayChange
            dayChangePct
            marketCode
            askPrice
            bidPrice
            midPrice
            lastPrice
            updateTime
            lastTradeDate
        }
      }`;

      res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
        headers: headers.header1,
      });

      var body = JSON.parse(res.body);

      check(res, {
        'is status 200': (r) => r.status === 200,
      });

      body.data.quotes.forEach(quote=>{
        check(quote.sedol, {
          'sedol is not null': (s) => s != null,
        });
        Object.values(quote).forEach(value=>{
          if(value==null){
            console.log(`**--------Null value for ${quote.marketCode} sedol ${quote.sedol}-----------**`)
          }
          check(value, {
            'attribute value is not null': (v) => v != null,
          });
        })
      })
  });

  instruments.forEach((instrument)=>{
    console.log(`Verify market cap for stock ${instrument}`)
    group('Query Market Cap and price in Quote', function () { 
          const query = `query {
            quote(identifier: "${instrument}") {
              __typename
              name
              nameShort
              symbol
      
              ...on Equity {
                  isin
                  sedol
                  askPrice
                  bidPrice
                marketCap
                marketCapFormatted
              }
          }
      }`;
  
          res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
            headers: headers.header1,
          });
  
          var body = JSON.parse(res.body);
          console.log(` market cap ${body.data.quote.marketCapFormatted}`)
          check(res, {
            'is status 200': (r) => r.status === 200,
          });       
          check(body.data.quote.marketCapFormatted, {
              'has lenght less then 12': (value) => value.length < 15,
              'has mn bn tn in formatted mCap': (value) => value.includes('mn') || value.includes('bn') || value.includes('tn'),
              'has currency in formatted mCap': (value) => value.includes('£') || value.includes('$') || value.includes('€') || value.includes('CHF') || value.includes('CAD')
            });
          
        quoteRespTime.add(res.timings.duration);
        quoteStats.add(1);
    });
  })

  group('Query marketcodes with dots', function () {
    const allSedols = codes;
    // const sedolNames = []
    // const sedolNames2 = []


    const testSedols = allSedols.filter((code) => {
      const val = String(code)
      return val.includes(".")
    });

    testSedols.forEach(code => {
      const query2 = `query {
        quotes(identifiers: ["${code}", "LSE:BARC"]) {
          name
          marketCode
        }
      }`

      const query = `query {
        quotes(identifiers: ["LSE:BARC", "${code}"]) {
          name
          marketCode
        }
      }`;

      let res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
        headers: headers.header1,
      });

      let res2 = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query2 }), {
        headers: headers.header1,
      });
  

      var body = JSON.parse(res.body);
      var body2 = JSON.parse(res2.body);
  
      check(res, {
        'is status 200': (r) => r.status === 200,
      });

    const arrayCheck = (a) => {
      const sedolNames = []
        Object.entries(a).forEach(value => (value[0] === "name") ? sedolNames.push(value[1]) : null)
        return sedolNames
      }

      arrayCheck(body.data.quotes[1]).forEach((val) => {
        arrayCheck(body2.data.quotes[0]).forEach((val2) => {
          check(val, {
            'sedols are the same': (v) => v === val2
          });
        });
      });
    });    
  });
}

export function handleSummary(data) {
  return {
    "GQLReports/quoteGQL Test.html": htmlReport(data),
     stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}