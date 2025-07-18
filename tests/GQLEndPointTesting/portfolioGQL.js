import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group } from 'k6';
import { getCSVData } from "../../commonUtil/DataParmetrisation.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var shareClassSizeCallRespTime = new Trend("shareClassSize_response_time");
var shareClassSizeCallStats = new Rate("shareClassSize_stats");

var fundSizeCallRespTime = new Trend("fundSize_response_time");
var fundSizeCalllStats = new Rate("fundSize_stats");

var marketCapRespTime = new Trend("marketCap_response_time");
var marketCapStats = new Rate("marketCap_stats");

var regionCategoryRespTime = new Trend("regionCategoryr_response_time");
var regionCategoryStats = new Rate("regionCategory_stats");

var portfolioRespTime = new Trend("portfolio_response_time");
var portfolioStats = new Rate("portfolio_stats");

var bondStatisticsRespTime = new Trend("bondStatistics_response_time");
var bondStatisticsStats = new Rate("bondStatistics_stats");

var equityValuationRespTime = new Trend("equityValuation_response_time");
var equityValuationStats = new Rate("equityValuation_stats");

var assetNetRespTime = new Trend("assetNet_response_time");
var assetNetStats = new Rate("assetNet_stats");

var maturityDistributionRespTime = new Trend("maturityDistribution_response_time");
var maturityDistributionStats = new Rate("maturityDistribution_stats");

var maturityDistributionCategoryRespTime = new Trend("maturityDistribution_response_time");
var maturityDistributionCategoryStats = new Rate("maturityDistribution_stats");

var supersectorRespTime = new Trend("supersector_response_time");
var supersectorStats = new Rate("supersector_stats");

var FixedIncomeSectorsRespTime = new Trend("FixedIncomeSectors_response_time");
var FixedIncomeSectorsStats = new Rate("FixedIncomeSectors_stats");

var categoryRespTime = new Trend("category_response_time");
var categoryStats = new Rate("category_stats");

var FixedIncomeSectorLevel2RespTime = new Trend("FixedIncomeSectors_response_time");
var FixedIncomeSectorLevel2Stats = new Rate("FixedIncomeSectors_stats");

var styleBoxRespTime = new Trend("styleBox_response_time");
var styleBoxStats = new Rate("shareBox_stats");

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

const headers1 = JSON.parse(open("../../data/headers.json"));


export default function () {
  if (__ENV.ENDPOINT === undefined) {
    fail("Environment: ENDPOINT must be set");
  }

  var input = getCSVData();

  group('Share Class Size Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      console.log('EXAMPLE DATA')
      console.log(JSON.stringify(input[i]))
      var identifier = obj.Name;
      var isPortfolioEnabled = obj.isPortfolioEnabled;

      if (isPortfolioEnabled === 'true') {
        const query = `query ShareclassSize{
    portfolio(identifier: "${identifier}") {
      shareClassSize{
        currency
        dayEndDate
        dayEndValue   
    }   
    }
  }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);
        console.log(body)

        check(res, {
          'is status 200': (r) => r.status === 200,
        });
        if (body.data.portfolio.shareClassSize.length > 0) {
          check((Object.keys(body.data.portfolio.shareClassSize[0])[0]), {
            'has currency': (key) => key == 'currency'
          });

          check(Object.values(body.data.portfolio.shareClassSize[0])[0], {
            'has currency value not null': (value) => value != null
          });

          check((Object.keys(body.data.portfolio.shareClassSize[0])[1]), {
            'has dayEndDate': (key) => key == 'dayEndDate'
          });

          check(Object.values(body.data.portfolio.shareClassSize[0])[1], {
            'has dayEndDate value not null': (value) => value != null
          });

          check((Object.keys(body.data.portfolio.shareClassSize[0])[2]), {
            'has dayEndValue': (key) => key == 'dayEndValue'
          });

          check(Object.values(body.data.portfolio.shareClassSize[0])[2], {
            'has dayEndValue value not null': (value) => value != null
          });
        }
      }
    }
    shareClassSizeCallRespTime.add(res.timings.duration);
    shareClassSizeCallStats.add(1);

  });

  group('Fund Size Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isPortfolioEnabled = obj.isPortfolioEnabled;

      if (isPortfolioEnabled === 'true') {
        const query = `query FundSize{
      portfolio(identifier: "${identifier}") {
      fundSize{
      currency
      dayEndDate
      dayEndValue   
      }   
      }
      }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);

        if (body.data.portfolio.fundSize.length > 0) {
          check(res, {
            'is status 200': (r) => r.status === 200,
          });

          check((Object.keys(body.data.portfolio.fundSize[0])[0]), {
            'has currency': (key) => key == 'currency'
          });

          check(Object.values(body.data.portfolio.fundSize[0])[0], {
            'has currency value not null': (value) => value != null
          });

          check((Object.keys(body.data.portfolio.fundSize[0])[1]), {
            'has dayEndDate': (key) => key == 'dayEndDate'
          });

          check(Object.values(body.data.portfolio.fundSize[0])[1], {
            'has dayEndDate value not null': (value) => value != null
          });

          check((Object.keys(body.data.portfolio.fundSize[0])[2]), {
            'has dayEndValue': (key) => key == 'dayEndValue'
          });

          check(Object.values(body.data.portfolio.fundSize[0])[2], {
            'has dayEndValue value not null': (value) => value != null
          });
        }
      }
    }
    fundSizeCallRespTime.add(res.timings.duration);
    fundSizeCalllStats.add(1);

  });

  group('MarketCap and MarketCapCat Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isPortfolioEnabled = obj.isPortfolioEnabled;

      if (isPortfolioEnabled === 'true') {
        const query = `query {
      portfolio(identifier:"${identifier}") {
        marketCapitalisationCat {
          notClassified
          breakdownValues {
            id
            value
            label
          }
        }    
       marketCapitalisation {
          notClassified
          breakdownValues {
            id
            value
            label
          }
        }
      }      
    }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        check(body.data.portfolio.marketCapitalisationCat.notClassified, {
          'has MarketCapCat notClassified value not null': (value) => value !== undefined && value !== ""
        });

        check(body.data.portfolio.marketCapitalisation.notClassified, {
          'has MarketCap notClassified value not null': (value) => value !== undefined && value !== ""
        });

        if (body.data.portfolio.marketCapitalisation.breakdownValues != null) {
          check(body.data.portfolio.marketCapitalisation.breakdownValues[0], {
            'has MarketCap id:1, label=>Giant ,value=>not null': (breakdownValues) => breakdownValues.id == '1' && breakdownValues.value != null && breakdownValues.label == 'Giant'
          });

          check(body.data.portfolio.marketCapitalisation.breakdownValues[1], {
            'has MarketCap id:2, label=>Large ,value=>not null': (breakdownValues) => breakdownValues.id == '2' && breakdownValues.value != null && breakdownValues.label == 'Large'
          });
          check(body.data.portfolio.marketCapitalisation.breakdownValues[2], {
            'has MarketCap id:3, label=>Medium ,value=>not null': (breakdownValues) => breakdownValues.id == '3' && breakdownValues.value != null && breakdownValues.label == 'Medium'
          });

          check(body.data.portfolio.marketCapitalisation.breakdownValues[3], {
            'has MarketCap id:4, label=>Small ,value=>not null': (breakdownValues) => breakdownValues.id == '4' && breakdownValues.value != null && breakdownValues.label == 'Small'
          });
          check(body.data.portfolio.marketCapitalisation.breakdownValues[4], {
            'has MarketCap id:5, label=>Micro ,value=>not null': (breakdownValues) => breakdownValues.id == '5' && breakdownValues.value != null && breakdownValues.label == 'Micro'
          });
        }

        if (body.data.portfolio.marketCapitalisationCat.breakdownValues != null) {
          check(body.data.portfolio.marketCapitalisationCat.breakdownValues[0], {
            'has MarketCapCat id:1, label=>Giant ,value=>not null': (breakdownValues) => breakdownValues.id == '1' && breakdownValues.value != null && breakdownValues.label == 'Giant'
          });

          check(body.data.portfolio.marketCapitalisationCat.breakdownValues[1], {
            'has MarketCapCat id:2, label=>Large ,value=>not null': (breakdownValues) => breakdownValues.id == '2' && breakdownValues.value != null && breakdownValues.label == 'Large'
          });
          check(body.data.portfolio.marketCapitalisationCat.breakdownValues[2], {
            'has MarketCapCat id:3, label=>Medium ,value=>not null': (breakdownValues) => breakdownValues.id == '3' && breakdownValues.value != null && breakdownValues.label == 'Medium'
          });

          check(body.data.portfolio.marketCapitalisationCat.breakdownValues[3], {
            'has MarketCapCat id:4, label=>Small ,value=>not null': (breakdownValues) => breakdownValues.id == '4' && breakdownValues.value != null && breakdownValues.label == 'Small'
          });
          check(body.data.portfolio.marketCapitalisationCat.breakdownValues[4], {
            'has MarketCapCat id:5, label=>Micro ,value=>not null': (breakdownValues) => breakdownValues.id == '5' && breakdownValues.value != null && breakdownValues.label == 'Micro'
          });
        }
      }
    }
    marketCapRespTime.add(res.timings.duration);
    marketCapStats.add(1);
  });

  group('Region category Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isPortfolioEnabled = obj.isPortfolioEnabled;

      if (isPortfolioEnabled === 'true') {
        const query = `query RegionCategory{
      portfolio(identifier: "${identifier}") {
      regionCategory{
        id
        value
        label
        superRegion  
      }   
      }
      }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        for (let i = 0; i < body.data.portfolio.regionCategory.length; i++) {
          let id = body.data.portfolio.regionCategory[i].id;
          check(id, {
            'has id => not null': (idValue) => idValue != null
          });
        }

        for (let i = 0; i < body.data.portfolio.regionCategory.length; i++) {
          let id = body.data.portfolio.regionCategory[i].id;

          if (id == 1) {
            check(body.data.portfolio.regionCategory[0], {
              'has region label=>United States ,superRegion=>Americas and value=>not null for id:1': (regionCatergory) => regionCatergory.label == "United States" && regionCatergory.superRegion == "Americas" && regionCatergory.value != null
            });
          }
          if (id == 2) {
            check(body.data.portfolio.regionCategory[1], {
              'has region label=>Canada ,superRegion=>Americas and value=>not null for id:2': (regionCatergory) => regionCatergory.label == "Canada" && regionCatergory.superRegion == "Americas" && regionCatergory.value != null
            });
          }
          if (id == 3) {
            check(body.data.portfolio.regionCategory[2], {
              'has region label=>Latin America ,superRegion=>Americas and value=>not null  for id:3': (regionCatergory) => regionCatergory.label == "Latin America" && regionCatergory.superRegion == "Americas" && regionCatergory.value != null
            });
          }
          if (id == 4) {
            check(body.data.portfolio.regionCategory[3], {
              'has region label=>United Kingdom ,superRegion=>Greater Europe and value=>not null for id:4': (regionCatergory) => regionCatergory.label == "United Kingdom" && regionCatergory.superRegion == "Greater Europe" && regionCatergory.value != null
            });
          }
          if (id == 5) {
            check(body.data.portfolio.regionCategory[4], {
              'has region label=>Eurozone ,superRegion=>Greater Europe and value=>not null for id:5': (regionCatergory) => regionCatergory.label == "Eurozone" && regionCatergory.superRegion == "Greater Europe" && regionCatergory.value != null
            });
          }
          if (id == 6) {
            check(body.data.portfolio.regionCategory[5], {
              'has region label=>Europe - ex Euro ,superRegion=>Greater Europe and value=>not null for id:6': (regionCatergory) => regionCatergory.label == "Europe - ex Euro" && regionCatergory.superRegion == "Greater Europe" && regionCatergory.value != null
            });
          }
          if (id == 7) {
            check(body.data.portfolio.regionCategory[6], {
              'has region label=>Europe - Emerging ,superRegion=>Greater Europe and value=>not null for id:7': (regionCatergory) => regionCatergory.label == "Europe - Emerging" && regionCatergory.superRegion == "Greater Europe" && regionCatergory.value != null
            });
          }
          if (id == 8) {
            check(body.data.portfolio.regionCategory[7], {
              'has region label=>Africa ,superRegion=>Greater Europe and value=>not null for id:8': (regionCatergory) => regionCatergory.label == "Africa" && regionCatergory.superRegion == "Greater Europe" && regionCatergory.value != null
            });
          }
          if (id == 9) {
            check(body.data.portfolio.regionCategory[8], {
              'has region label=>Middle East ,superRegion=>Greater Europe and value=>not null for id:9': (regionCatergory) => regionCatergory.label == "Middle East" && regionCatergory.superRegion == "Greater Europe" && regionCatergory.value != null
            });
          }
          if (id == 10) {
            check(body.data.portfolio.regionCategory[9], {
              'has region label=>Japan ,superRegion=>Greater Asia and value=>not null for id:10': (regionCatergory) => regionCatergory.label == "Japan" && regionCatergory.superRegion == "Greater Asia" && regionCatergory.value != null
            });
          }
          if (id == 11) {
            check(body.data.portfolio.regionCategory[10], {
              'has region label=>Australasia ,superRegion=>Greater Asia and value=>not null for id:11': (regionCatergory) => regionCatergory.label == "Australasia" && regionCatergory.superRegion == "Greater Asia" && regionCatergory.value != null
            });
          }
          if (id == 12) {
            check(body.data.portfolio.regionCategory[11], {
              'has region label=>Asia - Developed" ,superRegion=>Greater Asia and value=>not null for id:12': (regionCatergory) => regionCatergory.label == "Asia - Developed" && regionCatergory.superRegion == "Greater Asia" && regionCatergory.value != null
            });
          }
          if (id == 13) {
            check(body.data.portfolio.regionCategory[12], {
              'has region label=>Asia - Emerging ,superRegion=>Greater Asia and value=>not null for id:13': (regionCatergory) => regionCatergory.label == "Asia - Emerging" && regionCatergory.superRegion == "Greater Asia" && regionCatergory.value != null
            });
          }
          if (id == 14) {
            check(body.data.portfolio.regionCategory[13], {
              'has region label=>Emerging Market ,superRegion=>NA and value=>not null for id:14': (regionCatergory) => regionCatergory.label == "Emerging Market" && regionCatergory.superRegion == "NA" && regionCatergory.value != null
            });
          }
          if (id == 15) {
            check(body.data.portfolio.regionCategory[14], {
              'has region label=>Developed country ,superRegion=>NA and value=>not null for id:15': (regionCatergory) => regionCatergory.label == "Developed Country" && regionCatergory.superRegion == "NA" && regionCatergory.value != null
            });
          }
          if (id == 16) {
            check(body.data.portfolio.regionCategory[15], {
              'has region label=>Not Classified ,superRegion=>NA and value=>not null for id:16': (regionCatergory) => regionCatergory.label == "Not Classified" && regionCatergory.superRegion == "NA" && regionCatergory.value != null
            });
          }
        }
      }
    }
    regionCategoryRespTime.add(res.timings.duration);
    regionCategoryStats.add(1);
  });
  group('Portfolio Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isPortfolioEnabled = obj.isPortfolioEnabled;

      if (isPortfolioEnabled === 'true') {
        const query = `query {
      portfolio(identifier:"${identifier}") {
      date
      }
      }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        check(body.data.portfolio.date, {
          'has date  => not null': (value) => value != "" && value != null
        });
      }
    }
    portfolioRespTime.add(res.timings.duration);
    portfolioStats.add(1);

  });
  group('bondStatisticsCategory and bondStatistics Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isPortfolioEnabled = obj.isPortfolioEnabled;

      if (isPortfolioEnabled === 'true') {
        const query = `query {
      portfolio(identifier:"${identifier}") {
        bondStatisticsCategory{
          effectiveMaturity
          averageCreditQuality
        modifiedDuration
          averageCreditQualityLabel
        }
        
        bondStatistics{
          styleBox
          averageCreditQualityLabel
          effectiveMaturity
          averageCreditQuality
          modifiedDuration
        }  
      }
    }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        check(body.data.portfolio.bondStatisticsCategory.effectiveMaturity, {
          'has effectiveMaturity for bondStatisticsCategory not null': (effectiveMaturityValue) => effectiveMaturityValue != null
        });

        check(body.data.portfolio.bondStatisticsCategory.averageCreditQuality, {
          'has averageCreditQuality for bondStatisticsCategory not null': (averageCreditQualityValue) => averageCreditQualityValue != null
        });

        check(body.data.portfolio.bondStatisticsCategory.modifiedDuration, {
          'has modifiedDuration for bondStatisticsCategory not null': (modifiedDurationValue) => modifiedDurationValue != null
        });

        check(body.data.portfolio.bondStatisticsCategory.averageCreditQualityLabel, {
          'has averageCreditQualityLabel for bondStatisticsCategory not null': (averageCreditQualityLabelValue) => averageCreditQualityLabelValue != null
        });

        check(body.data.portfolio.bondStatistics.styleBox, {
          'has styleBox for bondStatistics not null': (styleBoxValue) => styleBoxValue != null
        });

        check(body.data.portfolio.bondStatistics.averageCreditQualityLabel, {
          'has averageCreditQualityLabel for bondStatistics not null': (averageCreditQualityLabelValue) => averageCreditQualityLabelValue != null
        });

        check(body.data.portfolio.bondStatistics.effectiveMaturity, {
          'has effectiveMaturity for bondStatistics not null': (effectiveMaturityValue) => effectiveMaturityValue != null
        });

        check(body.data.portfolio.bondStatistics.averageCreditQuality, {
          'has averageCreditQuality for bondStatistics not null': (averageCreditQualityValue) => averageCreditQualityValue != null
        });

        check(body.data.portfolio.bondStatistics.modifiedDuration, {
          'has modifiedDuration for bondStatistics not null': (modifiedDurationValue) => modifiedDurationValue != null
        });
      }
    }
    bondStatisticsRespTime.add(res.timings.duration);
    bondStatisticsStats.add(1);
  });
  group('Equity Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isPortfolioEnabled = obj.isPortfolioEnabled;

      if (isPortfolioEnabled === 'true') {
        const query = `query {
      portfolio(identifier:"${identifier}") {
      equityValuation{
      styleBox
      priceEarnings
      priceBook
      priceSales
      priceCashFlow 
      dividendYieldFactor 
      longProjectedEarningsGrowth 
      historicalEarningsGrowth  
      salesGrowth 
      cashFlowGrowth  
      bookValueGrowth
      }
      }
      }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        check(body.data.portfolio.equityValuation.styleBox, {
          'has styleBox for equityValuation not null': (styleBoxValue) => styleBoxValue != null && styleBoxValue != undefined
        });

        check(body.data.portfolio.equityValuation.priceEarnings, {
          'has priceEarnings for equityValuation not null': (priceEarningsValue) => priceEarningsValue != null && priceEarningsValue != undefined
        });

        check(body.data.portfolio.equityValuation.priceBook, {
          'has priceBook for equityValuation not null': (priceBookValue) => priceBookValue != null && priceBookValue != undefined
        });

        check(body.data.portfolio.equityValuation.priceSales, {
          'has priceSales for equityValuation not null': (priceSalesValue) => priceSalesValue != null && priceSalesValue != undefined
        });

        check(body.data.portfolio.equityValuation.priceCashFlow, {
          'has priceCashFlow for equityValuation not null': (priceCashFlowValue) => priceCashFlowValue != null && priceCashFlowValue != undefined
        });

        check(body.data.portfolio.equityValuation.dividendYieldFactor, {
          'has dividendYieldFactor for equityValuation not null': (dividendYieldFactorValue) => dividendYieldFactorValue != null && dividendYieldFactorValue != undefined
        });

        check(body.data.portfolio.equityValuation.longProjectedEarningsGrowth, {
          'has longProjectedEarningsGrowth for equityValuation not null': (longProjectedEarningsGrowthValue) => longProjectedEarningsGrowthValue != null && longProjectedEarningsGrowthValue != undefined
        });

        check(body.data.portfolio.equityValuation.historicalEarningsGrowth, {
          'has historicalEarningsGrowth for equityValuation not null': (historicalEarningsGrowthValue) => historicalEarningsGrowthValue != null && historicalEarningsGrowthValue != undefined
        });

        check(body.data.portfolio.equityValuation.salesGrowth, {
          'has salesGrowth for equityValuation not null': (salesGrowthValue) => salesGrowthValue != null && salesGrowthValue != undefined
        });

        check(body.data.portfolio.equityValuation.cashFlowGrowth, {
          'has cashFlowGrowth for equityValuation not null': (cashFlowGrowthValue) => cashFlowGrowthValue != null && cashFlowGrowthValue != undefined
        });

        check(body.data.portfolio.equityValuation.bookValueGrowth, {
          'has bookValueGrowth for equityValuation not null': (bookValueGrowthValue) => bookValueGrowthValue != null && bookValueGrowthValue != undefined
        });
      }
    }
    equityValuationRespTime.add(res.timings.duration);
    equityValuationStats.add(1);
  });

  group('AssetNet Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isPortfolioEnabled = obj.isPortfolioEnabled;

      if (isPortfolioEnabled === 'true') {
        const query = `query {
      portfolio(identifier:"${identifier}") {
        assetNet{
          id
          value
          label
          }}
      }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        for (let i = 0; i < body.data.portfolio.assetNet.length; i++) {
          let id = body.data.portfolio.assetNet[i].id;

          if (id == 1) {
            check(body.data.portfolio.assetNet[i], {
              'has id=>1 ,Label=>Stock and value=>not null': (assetNetValues) => assetNetValues.id == "1" && assetNetValues.label == "Stock" && assetNetValues.value != null
            });
          }
          if (id == 2) {
            check(body.data.portfolio.assetNet[i], {
              'has id=>2 ,Label=>Bond and value=>not null': (assetNetValues) => assetNetValues.id == "2" && assetNetValues.label == "Bond" && assetNetValues.value != null
            });
          }
          if (id == 3) {
            check(body.data.portfolio.assetNet[i], {
              'has id=>3 ,Label=>Cash and value=>not null': (assetNetValues) => assetNetValues.id == "3" && assetNetValues.label == "Cash" && assetNetValues.value != null
            });
          }
          if (id == 4) {
            check(body.data.portfolio.assetNet[i], {
              'has id=>4 ,Label=>Other and value=>not null': (assetNetValues) => assetNetValues.id == "4" && assetNetValues.label == "Other" && assetNetValues.value != null
            });
          }
          if (id == 99) {
            check(body.data.portfolio.assetNet[i], {
              'has id=>99 ,Label=>Property and value=>not null': (assetNetValues) => assetNetValues.id == "99" && assetNetValues.label == "Property" && assetNetValues.value != null
            });
          }
        }
      }
    }
    assetNetRespTime.add(res.timings.duration);
    assetNetStats.add(1);

  });
  group('MaturityDistribution Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isPortfolioEnabled = obj.isPortfolioEnabled;

      if (isPortfolioEnabled === 'true') {
        const query = `query {
      portfolio(identifier:"${identifier}") {
        maturityDistribution{
          value
          type
          label
          }}
      }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        for (let i = 0; i < body.data.portfolio.maturityDistribution.length; i++) {
          let type = body.data.portfolio.maturityDistribution[i].type;

          if (type == 1) {
            check(body.data.portfolio.maturityDistribution[i], {
              'has type=>1 ,Label=>1 to 3 years and value=>not null': (maturityDistributionValues) => maturityDistributionValues.type == "1" && maturityDistributionValues.label == "1 to 3 years" && maturityDistributionValues.value != null
            });
          }
          if (type == 2) {
            check(body.data.portfolio.maturityDistribution[i], {
              'has type=>2 ,Label=>3 to 5 years and value=>not null': (maturityDistributionValues) => maturityDistributionValues.type == "2" && maturityDistributionValues.label == "3 to 5 years" && maturityDistributionValues.value != null
            });
          }
          if (type == 3) {
            check(body.data.portfolio.maturityDistribution[i], {
              'has type=>3 ,Label=>5 to 7 years and value=>not null': (maturityDistributionValues) => maturityDistributionValues.type == "3" && maturityDistributionValues.label == "5 to 7 years" && maturityDistributionValues.value != null
            });
          }
          if (type == 4) {
            check(body.data.portfolio.maturityDistribution[i], {
              'has type=>4 ,Label=>7 to 10 years and value=>not null': (maturityDistributionValues) => maturityDistributionValues.type == "4" && maturityDistributionValues.label == "7 to 10 years" && maturityDistributionValues.value != null
            });
          }
          if (type == 5) {
            check(body.data.portfolio.maturityDistribution[i], {
              'has type=>5 ,Label=>10 to 15 years and value=>not null': (maturityDistributionValues) => maturityDistributionValues.type == "5" && maturityDistributionValues.label == "10 to 15 years" && maturityDistributionValues.value != null
            });
          }
          if (type == 6) {
            check(body.data.portfolio.maturityDistribution[i], {
              'has type=>6 ,Label=>15 to 20 years and value=>not null': (maturityDistributionValues) => maturityDistributionValues.type == "6" && maturityDistributionValues.label == "15 to 20 years" && maturityDistributionValues.value != null
            });
          }
          if (type == 7) {
            check(body.data.portfolio.maturityDistribution[i], {
              'has type=>7 ,Label=>20 to 30 years and value=>not null': (maturityDistributionValues) => maturityDistributionValues.type == "7" && maturityDistributionValues.label == "20 to 30 years" && maturityDistributionValues.value != null
            });
          }
          if (type == 8) {
            check(body.data.portfolio.maturityDistribution[i], {
              'has type=>8 ,Label=>Over 30 years and value=>not null': (maturityDistributionValues) => maturityDistributionValues.type == "8" && maturityDistributionValues.label == "Over 30 years" && maturityDistributionValues.value != null
            });
          }
        }
      }
    }
    maturityDistributionRespTime.add(res.timings.duration);
    maturityDistributionStats.add(1);

  });
  group('MaturityDistributionCategory Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isPortfolioEnabled = obj.isPortfolioEnabled;

      if (isPortfolioEnabled === 'true') {
        const query = `query {
      portfolio(identifier:"${identifier}") {
        maturityDistributionCategory{
          value
          type
          label
          }}
      }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        for (let i = 0; i < body.data.portfolio.maturityDistributionCategory.length; i++) {
          let type = body.data.portfolio.maturityDistributionCategory[i].type;

          if (type == 1) {
            check(body.data.portfolio.maturityDistributionCategory[i], {
              'has type=>1 ,Label=>1 to 3 years and value=>not null': (maturityDistributionCategoryValues) => maturityDistributionCategoryValues.type == "1" && maturityDistributionCategoryValues.label == "1 to 3 years" && maturityDistributionCategoryValues.value != null
            });
          }
          if (type == 2) {
            check(body.data.portfolio.maturityDistributionCategory[i], {
              'has type=>2 ,Label=>3 to 5 years and value=>not null': (maturityDistributionCategoryValues) => maturityDistributionCategoryValues.type == "2" && maturityDistributionCategoryValues.label == "3 to 5 years" && maturityDistributionCategoryValues.value != null
            });
          }
          if (type == 3) {
            check(body.data.portfolio.maturityDistributionCategory[i], {
              'has type=>3 ,Label=>5 to 7 years and value=>not null': (maturityDistributionCategoryValues) => maturityDistributionCategoryValues.type == "3" && maturityDistributionCategoryValues.label == "5 to 7 years" && maturityDistributionCategoryValues.value != null
            });
          }
          if (type == 4) {
            check(body.data.portfolio.maturityDistributionCategory[i], {
              'has type=>4 ,Label=>7 to 10 years and value=>not null': (maturityDistributionCategoryValues) => maturityDistributionCategoryValues.type == "4" && maturityDistributionCategoryValues.label == "7 to 10 years" && maturityDistributionCategoryValues.value != null
            });
          }
          if (type == 5) {
            check(body.data.portfolio.maturityDistributionCategory[i], {
              'has type=>5 ,Label=>10 to 15 years and value=>not null': (maturityDistributionCategoryValues) => maturityDistributionCategoryValues.type == "5" && maturityDistributionCategoryValues.label == "10 to 15 years" && maturityDistributionCategoryValues.value != null
            });
          }
          if (type == 6) {
            check(body.data.portfolio.maturityDistributionCategory[i], {
              'has type=>6 ,Label=>15 to 20 years and value=>not null': (maturityDistributionCategoryValues) => maturityDistributionCategoryValues.type == "6" && maturityDistributionCategoryValues.label == "15 to 20 years" && maturityDistributionCategoryValues.value != null
            });
          }
          if (type == 7) {
            check(body.data.portfolio.maturityDistributionCategory[i], {
              'has type=>7 ,Label=>20 to 30 years and value=>not null': (maturityDistributionCategoryValues) => maturityDistributionCategoryValues.type == "7" && maturityDistributionCategoryValues.label == "20 to 30 years" && maturityDistributionCategoryValues.value != null
            });
          }
          if (type == 8) {
            check(body.data.portfolio.maturityDistributionCategory[i], {
              'has type=>8 ,Label=>Over 30 years and value=>not null': (maturityDistributionCategoryValues) => maturityDistributionCategoryValues.type == "8" && maturityDistributionCategoryValues.label == "Over 30 years" && maturityDistributionCategoryValues.value != null
            });
          }
        }
      }
    }
    maturityDistributionCategoryRespTime.add(res.timings.duration);
    maturityDistributionCategoryStats.add(1);

  });

  group('SuperSectors mapping with id Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isPortfolioEnabled = obj.isPortfolioEnabled;

      if (isPortfolioEnabled === 'true') {
        const query = `query {
      portfolio(identifier:"${identifier}") {
      sector{
      label
      value
      id 
      superSector
      }
      }
      }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers1.header1,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status == 200,
        });

        body.data.portfolio.sector.forEach(function (s) {
          check(s, {
            'is label not null': (s) => s.label != "" && s.label != null,
            'is value not null': (s) => s.value != "" && s.value != null
          });

          if (s.superSector != '') {
            switch (s.id) {
              case 101:
                check(s.superSector, {
                  'is supersector as expected': (s) => s == 'Cyclical',
                });
                break;
              case 102:
                check(s.superSector, {
                  'is supersector as expected': (s) => s == 'Cyclical',
                });
                break;
              case 103:
                check(s.superSector, {
                  'is supersector as expected': (s) => s == 'Cyclical',
                });
                break;
              case 104:
                check(s.superSector, {
                  'is supersector as expected': (s) => s == 'Cyclical',
                });
                break;
              case 205:
                check(s.superSector, {
                  'is supersector as expected': (s) => s == 'Defensive',
                });
                break;
              case 206:
                check(s.superSector, {
                  'is supersector as expected': (s) => s == 'Defensive',
                });
                break;
              case 207:
                check(s.superSector, {
                  'is supersector as expected': (s) => s == 'Defensive',
                });
                break;
              case 308:
                check(s.superSector, {
                  'is supersector as expected': (s) => s == 'Sensitive',
                });
                break;
              case 309:
                check(s.superSector, {
                  'is supersector as expected': (s) => s == 'Sensitive',
                });
                break;
              case 310:
                check(s.superSector, {
                  'is supersector as expected': (s) => s == 'Sensitive',
                });
                break;
              case 311:
                check(s.superSector, {
                  'is supersector as expected': (s) => s == 'Sensitive',
                });
                break;
              default:
                console.log(`Unidentified - ${s.id}--${s.superSector}`)
                break;
            }
          }
          else {
            console.log(`superSector not available for - ${s.id}--${s.superSector}`)
          }
        })
      }
    }
    supersectorRespTime.add(res.timings.duration);
    supersectorStats.add(1);
  });

  group('FixedIncomeSectors Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isPortfolioEnabled = obj.isPortfolioEnabled;

      if (isPortfolioEnabled === 'true') {
        const query = `query {
      portfolio(identifier:"${identifier}") {
        fixedIncomeSectors{
          value
          type
          label
          benchmarkValue
          benchmarkType
          benchmarkLabel
          }}
      }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        for (let i = 0; i < body.data.portfolio.fixedIncomeSectors.length; i++) {
          let type = body.data.portfolio.fixedIncomeSectors[i].type;
          let benchmarkType = body.data.portfolio.fixedIncomeSectors[i].benchmarkType;

          if (type == 10) {
            check(body.data.portfolio.fixedIncomeSectors[i], {
              'has type=>10 ,label=>Government, value=>not null':
                (fixedIncomeSectorValues) => fixedIncomeSectorValues.type == "10" && fixedIncomeSectorValues.label == "Government" &&
                  fixedIncomeSectorValues.value != null
            });
          }
          if (type == 20) {
            check(body.data.portfolio.fixedIncomeSectors[i], {
              'has type=>20 ,label=>Municipal, value=>not null':
                (fixedIncomeSectorValues) => fixedIncomeSectorValues.type == "20" && fixedIncomeSectorValues.label == "Municipal" &&
                  fixedIncomeSectorValues.value != null
            });
          }
          if (type == 30) {
            check(body.data.portfolio.fixedIncomeSectors[i], {
              'has type=>30 ,label=>Corporate, value=>not null':
                (fixedIncomeSectorValues) => fixedIncomeSectorValues.type == "30" && fixedIncomeSectorValues.label == "Corporate" &&
                  fixedIncomeSectorValues.value != null
            });
          }
          if (type == 40) {
            check(body.data.portfolio.fixedIncomeSectors[i], {
              'has type=>40 ,label=>Securitized, value=>not null':
                (fixedIncomeSectorValues) => fixedIncomeSectorValues.type == "40" && fixedIncomeSectorValues.label == "Securitized" &&
                  fixedIncomeSectorValues.value != null
            });
          }
          if (type == 50) {
            check(body.data.portfolio.fixedIncomeSectors[i], {
              'has type=>50 ,label=>Cash & Equivalents, value=>not null':
                (fixedIncomeSectorValues) => fixedIncomeSectorValues.type == "50" && fixedIncomeSectorValues.label == "Cash & Equivalents" &&
                  fixedIncomeSectorValues.value != null
            });
          }
          if (type == 60) {
            check(body.data.portfolio.fixedIncomeSectors[i], {
              'has type=>60 ,label=>Derivative, value=>not null':
                (fixedIncomeSectorValues) => fixedIncomeSectorValues.type == "60" && fixedIncomeSectorValues.label == "Derivative" &&
                  fixedIncomeSectorValues.value != null
            });
          }
          if (benchmarkType == 10) {
            check(body.data.portfolio.fixedIncomeSectors[i], {
              'has benchmarkValue=> not null, benchmarkType=>10, benchmarkLabel=>Government':
                (fixedIncomeSectorValues) => fixedIncomeSectorValues.benchmarkType == "10" && fixedIncomeSectorValues.benchmarkLabel == "Government" &&
                  fixedIncomeSectorValues.benchmarkValue != null
            });
          }
          if (benchmarkType == 20) {
            check(body.data.portfolio.fixedIncomeSectors[i], {
              'has benchmarkValue=> not null, benchmarkType=>20, benchmarkLabel=>Municipal':
                (fixedIncomeSectorValues) => fixedIncomeSectorValues.benchmarkType == "20" && fixedIncomeSectorValues.benchmarkLabel == "Municipal" &&
                  fixedIncomeSectorValues.benchmarkValue != null
            });
          }
          if (benchmarkType == 30) {
            check(body.data.portfolio.fixedIncomeSectors[i], {
              'has benchmarkValue=> not null, benchmarkType=>30, benchmarkLabel=>Corporate':
                (fixedIncomeSectorValues) => fixedIncomeSectorValues.benchmarkType == "30" && fixedIncomeSectorValues.benchmarkLabel == "Corporate" &&
                  fixedIncomeSectorValues.benchmarkValue != null
            });
          }
          if (benchmarkType == 40) {
            check(body.data.portfolio.fixedIncomeSectors[i], {
              'has benchmarkValue=> not null, benchmarkType=>40, benchmarkLabel=>Securitized':
                (fixedIncomeSectorValues) => fixedIncomeSectorValues.benchmarkType == "40" && fixedIncomeSectorValues.benchmarkLabel == "Securitized" &&
                  fixedIncomeSectorValues.benchmarkValue != null
            });
          }
          if (benchmarkType == 50) {
            check(body.data.portfolio.fixedIncomeSectors[i], {
              'has benchmarkValue=> not null, benchmarkType=>50, benchmarkLabel=>Cash & Equivalents':
                (fixedIncomeSectorValues) => fixedIncomeSectorValues.benchmarkType == "50" && fixedIncomeSectorValues.benchmarkLabel == "Cash & Equivalents" &&
                  fixedIncomeSectorValues.benchmarkValue != null
            });
          }
          if (benchmarkType == 60) {
            check(body.data.portfolio.fixedIncomeSectors[i], {
              'has benchmarkValue=> not null, benchmarkType=>60, benchmarkLabel=>Derivative':
                (fixedIncomeSectorValues) => fixedIncomeSectorValues.benchmarkType == "60" && fixedIncomeSectorValues.benchmarkLabel == "Derivative" &&
                  fixedIncomeSectorValues.benchmarkValue != null
            });
          }
        }
      }
    }
    FixedIncomeSectorsRespTime.add(res.timings.duration);
    FixedIncomeSectorsStats.add(1);
  });

  group('Category mapping with id Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isPortfolioEnabled = obj.isPortfolioEnabled;

      if (isPortfolioEnabled === 'true') {
        const query = `query {
      portfolio(identifier:"${identifier}") {
        sectorCategory{
          id
          value
          label
          superSector
      }
      }
      }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers1.header1,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status == 200,
        });

        body.data.portfolio.sectorCategory.forEach(function (s) {
          check(s, {
            'is value not null': (s) => s.value != "" && s.value != null,
            'is superSector not null': (s) => s.superSector != "" && s.superSector != null
          });

          if (s.label != '') {
            switch (s.id) {
              case 101:
                check(s.label, {
                  'is label as expected': (s) => s == 'Basic Materials',
                });
                break;
              case 102:
                check(s.label, {
                  'is label as expected': (s) => s == 'Consumer Cyclical',
                });
                break;
              case 103:
                check(s.label, {
                  'is label as expected': (s) => s == 'Financial Services',
                });
                break;
              case 104:
                check(s.label, {
                  'is label as expected': (s) => s == 'Real Estate',
                });
                break;
              case 205:
                check(s.label, {
                  'is label as expected': (s) => s == 'Consumer Defensive',
                });
                break;
              case 206:
                check(s.label, {
                  'is label as expected': (s) => s == 'Healthcare',
                });
                break;
              case 207:
                check(s.label, {
                  'is label as expected': (s) => s == 'Utilities',
                });
                break;
              case 308:
                check(s.label, {
                  'is label as expected': (s) => s == 'Communication Services',
                });
                break;
              case 309:
                check(s.label, {
                  'is label as expected': (s) => s == 'Energy',
                });
                break;
              case 310:
                check(s.label, {
                  'is label as expected': (s) => s == 'Industrials',
                });
                break;
              case 311:
                check(s.label, {
                  'is label as expected': (s) => s == 'Technology',
                });
                break;
              default:
                console.log(`Unidentified - ${s.id}--${s.label}`)
                break;
            }
          }
          else {
            console.log(`label not available for - ${s.id}--${s.label}`)
          }
        })
      }
    }
    categoryRespTime.add(res.timings.duration);
    categoryStats.add(1);
  });
  group('FixedIncomeSectorsLevel2 Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isPortfolioEnabled = obj.isPortfolioEnabled;

      if (isPortfolioEnabled === 'true') {
        const query = `query {
      portfolio(identifier:"${identifier}") {
        fixedIncomeSectorLevel2{
          value
          type
          label
          benchmarkValue
          benchmarkType
          benchmarkLabel
          }}
      }`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        for (let i = 0; i < body.data.portfolio.fixedIncomeSectorLevel2.length; i++) {
          let type = body.data.portfolio.fixedIncomeSectorLevel2[i].type;
          let benchMarkType = body.data.portfolio.fixedIncomeSectorLevel2[i].benchmarkType;

          if (type == 1010) {
            check(body.data.portfolio.fixedIncomeSectorLevel2[i], {
              'has type=>1010 ,label=>Treasury, value=>not null':
                (fixedIncomeSectorLevel2Values) => fixedIncomeSectorLevel2Values.type == "1010" && fixedIncomeSectorLevel2Values.label == "Treasury" &&
                  fixedIncomeSectorLevel2Values.value != null
            });
          }
          if (type == 1020) {
            check(body.data.portfolio.fixedIncomeSectorLevel2[i], {
              'has type=>1020 ,label=>Government Related, value=>not null':
                (fixedIncomeSectorLevel2Values) => fixedIncomeSectorLevel2Values.type == "1020" && fixedIncomeSectorLevel2Values.label == "Government Related" &&
                  fixedIncomeSectorLevel2Values.value != null
            });
          }
          if (type == 3010) {
            check(body.data.portfolio.fixedIncomeSectorLevel2[i], {
              'has type=>3010 ,label=>Bank Loan, value=>not null':
                (fixedIncomeSectorLevel2Values) => fixedIncomeSectorLevel2Values.type == "3010" && fixedIncomeSectorLevel2Values.label == "Bank Loan" &&
                  fixedIncomeSectorLevel2Values.value != null
            });
          }
          if (type == 3030) {
            check(body.data.portfolio.fixedIncomeSectorLevel2[i], {
              'has type=>3030 ,label=>Corporate Bond, value=>not null':
                (fixedIncomeSectorLevel2Values) => fixedIncomeSectorLevel2Values.type == "3030" && fixedIncomeSectorLevel2Values.label == "Corporate Bond" &&
                  fixedIncomeSectorLevel2Values.value != null
            });
          }
          if (type == 3020) {
            check(body.data.portfolio.fixedIncomeSectorLevel2[i], {
              'has type=>3020 ,label=>Convertible, value=>not null':
                (fixedIncomeSectorLevel2Values) => fixedIncomeSectorLevel2Values.type == "3020" && fixedIncomeSectorLevel2Values.label == "Convertible" &&
                  fixedIncomeSectorLevel2Values.value != null
            });
          }
          if (type == 3040) {
            check(body.data.portfolio.fixedIncomeSectorLevel2[i], {
              'has type=>3040 ,label=>Preferred, value=>not null':
                (fixedIncomeSectorLevel2Values) => fixedIncomeSectorLevel2Values.type == "3040" && fixedIncomeSectorLevel2Values.label == "Preferred" &&
                  fixedIncomeSectorLevel2Values.value != null
            });
          }
          if (type == 4010) {
            check(body.data.portfolio.fixedIncomeSectorLevel2[i], {
              'has type=>4010 ,label=>Agency Mortgage Backed, value=>not null':
                (fixedIncomeSectorLevel2Values) => fixedIncomeSectorLevel2Values.type == "4010" && fixedIncomeSectorLevel2Values.label == "Agency Mortgage Backed" &&
                  fixedIncomeSectorLevel2Values.value != null
            });
          }
          if (type == 4020) {
            check(body.data.portfolio.fixedIncomeSectorLevel2[i], {
              'has type=>4020 ,label=>Non-Agency Residential Mortgage Backed, value=>not null':
                (fixedIncomeSectorLevel2Values) => fixedIncomeSectorLevel2Values.type == "4020" && fixedIncomeSectorLevel2Values.label == "Non-Agency Residential Mortgage Backed" &&
                  fixedIncomeSectorLevel2Values.value != null
            });
          }
          if (type == 4030) {
            check(body.data.portfolio.fixedIncomeSectorLevel2[i], {
              'has type=>4030 ,label=>Commercial Mortgage Backed, value=>not null':
                (fixedIncomeSectorLevel2Values) => fixedIncomeSectorLevel2Values.type == "4030" && fixedIncomeSectorLevel2Values.label == "Commercial Mortgage Backed" &&
                  fixedIncomeSectorLevel2Values.value != null
            });
          }
          if (type == 4050) {
            check(body.data.portfolio.fixedIncomeSectorLevel2[i], {
              'has type=>4050 ,label=> Asset Backed, value=>not null':
                (fixedIncomeSectorLevel2Values) => fixedIncomeSectorLevel2Values.type == "4050" && fixedIncomeSectorLevel2Values.label == "Asset Backed" &&
                  fixedIncomeSectorLevel2Values.value != null
            });
          }
          if (type == 4040) {
            check(body.data.portfolio.fixedIncomeSectorLevel2[i], {
              'has type=>4040 ,label=>Covered Bond, value=>not null':
                (fixedIncomeSectorLevel2Values) => fixedIncomeSectorLevel2Values.type == "4040" && fixedIncomeSectorLevel2Values.label == "Covered Bond" &&
                  fixedIncomeSectorLevel2Values.value != null
            });
          }

          if (benchMarkType == 1010) {
            check(body.data.portfolio.fixedIncomeSectorLevel2[i], {
              'has benchmarkValue=> not null, benchmarkType=>1010, benchmarkLabel=>Treasury':
                (fixedIncomeSectorLevel2Values) => fixedIncomeSectorLevel2Values.benchmarkType == "1010" && fixedIncomeSectorLevel2Values.benchmarkLabel == "Treasury" &&
                  fixedIncomeSectorLevel2Values.benchmarkValue != null
            });
          }
          if (benchMarkType == 1020) {
            check(body.data.portfolio.fixedIncomeSectorLevel2[i], {
              'has benchmarkValue=> not null, benchmarkType=>1020, benchmarkLabel=>Government Related':
                (fixedIncomeSectorLevel2Values) => fixedIncomeSectorLevel2Values.benchmarkType == "1020" && fixedIncomeSectorLevel2Values.benchmarkLabel == "Government Related" &&
                  fixedIncomeSectorLevel2Values.benchmarkValue != null
            });
          }
          if (benchMarkType == 3010) {
            check(body.data.portfolio.fixedIncomeSectorLevel2[i], {
              'has benchmarkValue=> not null, benchmarkType=>3010, benchmarkLabel=>Bank Loan':
                (fixedIncomeSectorLevel2Values) => fixedIncomeSectorLevel2Values.benchmarkType == "3010" && fixedIncomeSectorLevel2Values.benchmarkLabel == "Bank Loan" &&
                  fixedIncomeSectorLevel2Values.benchmarkValue != null
            });
          }
          if (benchMarkType == 3030) {
            check(body.data.portfolio.fixedIncomeSectorLevel2[i], {
              'has benchmarkValue=> not null, benchmarkType=>3030, benchmarkLabel=>Corporate Bond':
                (fixedIncomeSectorLevel2Values) => fixedIncomeSectorLevel2Values.benchmarkType == "3030" && fixedIncomeSectorLevel2Values.benchmarkLabel == "Corporate Bond" &&
                  fixedIncomeSectorLevel2Values.benchmarkValue != null
            });
          }
          if (benchMarkType == 3020) {
            check(body.data.portfolio.fixedIncomeSectorLevel2[i], {
              'has benchmarkValue=> not null, benchmarkType=>3020, benchmarkLabel=>Convertible':
                (fixedIncomeSectorLevel2Values) => fixedIncomeSectorLevel2Values.benchmarkType == "3020" && fixedIncomeSectorLevel2Values.benchmarkLabel == "Convertible" &&
                  fixedIncomeSectorLevel2Values.benchmarkValue != null
            });
          }
          if (benchMarkType == 3040) {
            check(body.data.portfolio.fixedIncomeSectorLevel2[i], {
              'has benchmarkValue=> not null, benchmarkType=>3040, benchmarkLabel=>Preferred':
                (fixedIncomeSectorLevel2Values) => fixedIncomeSectorLevel2Values.benchmarkType == "3040" && fixedIncomeSectorLevel2Values.benchmarkLabel == "Preferred" &&
                  fixedIncomeSectorLevel2Values.benchmarkValue != null
            });
          }
          if (benchMarkType == 4010) {
            check(body.data.portfolio.fixedIncomeSectorLevel2[i], {
              'has benchmarkValue=> not null, benchmarkType=>4010, benchmarkLabel=>Agency Mortgage Backed':
                (fixedIncomeSectorLevel2Values) => fixedIncomeSectorLevel2Values.benchmarkType == "4010" && fixedIncomeSectorLevel2Values.benchmarkLabel == "Agency Mortgage Backed" &&
                  fixedIncomeSectorLevel2Values.benchmarkValue != null
            });
          }
          if (benchMarkType == 4020) {
            check(body.data.portfolio.fixedIncomeSectorLevel2[i], {
              'has benchmarkValue=> not null, benchmarkType=>4020, benchmarkLabel=>Non-Agency Residential Mortgage Backed':
                (fixedIncomeSectorLevel2Values) => fixedIncomeSectorLevel2Values.benchmarkType == "4020" && fixedIncomeSectorLevel2Values.benchmarkLabel == "Non-Agency Residential Mortgage Backed" &&
                  fixedIncomeSectorLevel2Values.benchmarkValue != null
            });
          }
          if (benchMarkType == 4030) {
            check(body.data.portfolio.fixedIncomeSectorLevel2[i], {
              'has benchmarkValue=> not null, benchmarkType=>4030, Commercial Mortgage Backed':
                (fixedIncomeSectorLevel2Values) => fixedIncomeSectorLevel2Values.benchmarkType == "4030" && fixedIncomeSectorLevel2Values.benchmarkLabel == "Commercial Mortgage Backed" &&
                  fixedIncomeSectorLevel2Values.benchmarkValue != null
            });
          }
          if (benchMarkType == 4050) {
            check(body.data.portfolio.fixedIncomeSectorLevel2[i], {
              'has benchmarkValue=> not null, benchmarkType=>4050, benchmarkLabel=> Asset Backed':
                (fixedIncomeSectorLevel2Values) => fixedIncomeSectorLevel2Values.benchmarkType == "4050" && fixedIncomeSectorLevel2Values.benchmarkLabel == "Asset Backed" &&
                  fixedIncomeSectorLevel2Values.benchmarkValue != null
            });
          }
          if (benchMarkType == 4040) {
            check(body.data.portfolio.fixedIncomeSectorLevel2[i], {
              'has benchmarkValue=> not null, benchmarkType=>4040, benchmarkLabel=>Covered Bond':
                (fixedIncomeSectorLevel2Values) => fixedIncomeSectorLevel2Values.benchmarkType == "4040" && fixedIncomeSectorLevel2Values.benchmarkLabel == "Covered Bond" &&
                  fixedIncomeSectorLevel2Values.benchmarkValue != null
            });
          }
        }
      }
    }
    FixedIncomeSectorLevel2RespTime.add(res.timings.duration);
    FixedIncomeSectorLevel2Stats.add(1);
  });
  group('Style Box Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isPortfolioEnabled = obj.isPortfolioEnabled;

      if (isPortfolioEnabled === 'true') {
        const query = `query ShareclassSize{
    portfolio(identifier: "${identifier}") {
      equityValuation{
        styleBox
        }
        bondStatistics{
        styleBox
        }}}`;

        res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
          headers: headers,
        });

        var body = JSON.parse(res.body);

        check(res, {
          'is status 200': (r) => r.status === 200,
        });

        check(body.data.portfolio.equityValuation.styleBox, {
          'has equityValuation styleBox not undefined': (styleBoxValue) => styleBoxValue === "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
        });

        check(body.data.portfolio.bondStatistics.styleBox, {
          'has bondStatistics styleBox not undefined': (styleBoxValue) => styleBoxValue === "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
        });
      }
    }
    styleBoxRespTime.add(res.timings.duration);
    styleBoxStats.add(1);

  });
}


export function handleSummary(data) {
  return {
    "GQLReports/portfolioGQL Test.html": htmlReport(data),
     stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}