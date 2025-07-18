import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group } from 'k6';
import { getCSVData } from "../../commonUtil/DataParmetrisation.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var targetMarketRespTime = new Trend("targetMarket_response_time");
var targetMarketStats = new Rate("targetMarket_stats");
var targetMarketFairValueRespTime = new Trend("targetMarketFairValue_response_time");
var targetMarketFairValueStats = new Rate("targetMarketFairValue_stats");

const headers = JSON.parse(open("../../data/headers.json"));

var res;
const instrumentList = JSON.parse(open("../../data/testData.json")).instrumentList;

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

  group('Target Market Datapoints Validation', function () {
    for (var i = 0; i < input.length; i++) {
      const obj = JSON.parse(JSON.stringify(input[i]));
      var identifier = obj.Name;
      var isTargetMarketFundEnabled = obj.isTargetMarketFund;
      var isTargetMarketETFEnabled = obj.isTargetMarketETF;

      if (isTargetMarketFundEnabled === 'true' || isTargetMarketETFEnabled === 'true') {
        const query = `query {
      targetMarket(identifier: "${identifier}") {
        objective{
          optionOrLeveraged
        }
        riskTolerance{
          SRI
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

        check(body.data.targetMarket.objective.optionOrLeveraged, {
          'has optionOrLeveraged not null/undefined': (optionOrLeveragedValue) => optionOrLeveragedValue !== undefined && optionOrLeveragedValue !== "" && optionOrLeveragedValue !== null
        });

        check(body.data.targetMarket.riskTolerance.SRI, {
          'has SRI not undefined': (SRIValue) => SRIValue !== undefined
        });
      }
    }
    targetMarketRespTime.add(res.timings.duration);
    targetMarketStats.add(1);
  });

  instrumentList.forEach(fund=>{
    console.log(`Verify Fair value assessment for fund ${fund}`)
    group('Fair Value Assessment Target Market Datapoints Validation', function () {            
      const query = `query {
        targetMarket(identifier: "${fund}") {    
        fairValueAssessment {  
              transactionCostsEstimated
              transactionCostsEstimatedDate
              transactionCostsActual
              transactionCostsActualDate
              transactionCostsActualCalculationStartDate
              valueAssessmentReviewDate
              dataReportingValueForMoney
              isAssessmentOfValueRequiredUnderCOLL
              outcomeOfCOLLAssessmentOfValueCode
              outcomeOfCOLLAssessmentOfValue
              outcomeOfPRINValueAssessmentOrReviewCode
              outcomeOfPRINValueAssessmentOrReview
              otherReviewRelatedToValueAndOrChangesCode
              otherReviewRelatedToValueAndOrChanges
              furtherInformationOnValueForMoneyUK
              valueAssessmentReviewNextDateUK
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

        check(body.data.targetMarket.fairValueAssessment, {
          'has transactionCostsEstimated greater than 0': (fairValueAssessment) => fairValueAssessment.transactionCostsEstimated >= 0,
          'has transactionCostsActual greater than 0': (fairValueAssessment) => fairValueAssessment.transactionCostsActual >= 0,
          'has dataReportingValueForMoney as true': (fairValueAssessment) => fairValueAssessment.dataReportingValueForMoney == true || fairValueAssessment.dataReportingValueForMoney == false || fairValueAssessment.dataReportingValueForMoney == null,
          'has isAssessmentOfValueRequiredUnderCOLL as true': (fairValueAssessment) => fairValueAssessment.isAssessmentOfValueRequiredUnderCOLL == true || fairValueAssessment.isAssessmentOfValueRequiredUnderCOLL == false || fairValueAssessment.isAssessmentOfValueRequiredUnderCOLL == null,
          'has outcomeOfCOLLAssessmentOfValueCode': (fairValueAssessment) => fairValueAssessment.outcomeOfCOLLAssessmentOfValueCode == 1 || fairValueAssessment.outcomeOfCOLLAssessmentOfValueCode == 2 || fairValueAssessment.outcomeOfCOLLAssessmentOfValueCode == null,
          'has outcomeOfPRINValueAssessmentOrReviewCode': (fairValueAssessment) => fairValueAssessment.outcomeOfPRINValueAssessmentOrReviewCode == 1 || fairValueAssessment.outcomeOfPRINValueAssessmentOrReviewCode == 2 || fairValueAssessment.outcomeOfPRINValueAssessmentOrReviewCode == null,
          'has otherReviewRelatedToValueAndOrChangesCode': (fairValueAssessment) => fairValueAssessment.otherReviewRelatedToValueAndOrChangesCode == 'A' || fairValueAssessment.otherReviewRelatedToValueAndOrChangesCode == '0' || fairValueAssessment.otherReviewRelatedToValueAndOrChangesCode == null,
        });

          if (body.data.targetMarket.fairValueAssessment != '') {
            switch (body.data.targetMarket.fairValueAssessment.outcomeOfCOLLAssessmentOfValueCode) {
              case 1:
                check(body.data.targetMarket.fairValueAssessment.outcomeOfCOLLAssessmentOfValue, {
                  'has outcomeOfCOLLAssessmentOfValue': (s) => s == 'Charges are justified based on assessment and any action taken or, where the first assessment is not yet due, based on initial product design',
                });
                break;
              case 2:
                check(body.data.targetMarket.fairValueAssessment.outcomeOfCOLLAssessmentOfValue, {
                  'has outcomeOfCOLLAssessmentOfValue': (s) => s == 'Charges are not justified, significant action is required',
                });
                break;
                default:
                  check(body.data.targetMarket.fairValueAssessment.outcomeOfCOLLAssessmentOfValue, {
                    'has outcomeOfCOLLAssessmentOfValue null': (s) => s == null
                  });
                  break;
            }

            switch (body.data.targetMarket.fairValueAssessment.outcomeOfPRINValueAssessmentOrReviewCode) {
              case 1:
                check(body.data.targetMarket.fairValueAssessment.outcomeOfPRINValueAssessmentOrReview, {
                  'has outcomeOfPRINValueAssessmentOrReview': (s) => s == 'Product expected to provide fair value for reasonably foreseeable period',
                });
                break;
              case 2:
                check(body.data.targetMarket.fairValueAssessment.outcomeOfPRINValueAssessmentOrReview, {
                  'has outcomeOfPRINValueAssessmentOrReview': (s) => s == 'Review indicates significant changes required in order to provide fair value',
                });
                break;
                default:
                  check(body.data.targetMarket.fairValueAssessment.outcomeOfPRINValueAssessmentOrReview, {
                    'has outcomeOfPRINValueAssessmentOrReview null': (s) => s == null
                  });
                  break;
            }

            switch (body.data.targetMarket.fairValueAssessment.otherReviewRelatedToValueAndOrChangesCode) {
              case 'A':
                check(body.data.targetMarket.fairValueAssessment.otherReviewRelatedToValueAndOrChanges, {
                  'has otherReviewRelatedToValueAndOrChanges': (s) => s == 'In line with ESMA supervisory briefing on the supervision of costs in UCITS and AIFs or relevant NCA supervisory activity',
                });
                break;
              case 'O':
                check(body.data.targetMarket.fairValueAssessment.otherReviewRelatedToValueAndOrChanges, {
                  'has otherReviewRelatedToValueAndOrChanges': (s) => s == 'Other local requirements or procedures',
                });
                break;
                default:
                  check(body.data.targetMarket.fairValueAssessment.otherReviewRelatedToValueAndOrChanges, {
                    'has otherReviewRelatedToValueAndOrChanges null': (s) => s == null
                  });
                  break;
            }
          }

          if(body.data.targetMarket.fairValueAssessment.valueAssessmentReviewNextDateUK!=null)
          {
            check(body.data.targetMarket.fairValueAssessment.valueAssessmentReviewNextDateUK, {
              'valueAssessmentReviewNextDateUK date in next year': (s) => s!="" || s!=undefined
            });
          }

          if(body.data.targetMarket.fairValueAssessment.transactionCostsEstimatedDate!=null)
          {
            check(body.data.targetMarket.fairValueAssessment.transactionCostsEstimatedDate, {
              'has transactionCostsEstimatedDate date in last year': (s) => s.includes(new Date().getFullYear()-1),
            });
          }
          //Removed the getFullYear() check as LSE:CUK has 2008-09-16 for valueAssessmentReviewNextDateUK
          if(body.data.targetMarket.fairValueAssessment.valueAssessmentReviewDate!=null)
          {
            check(body.data.targetMarket.fairValueAssessment.valueAssessmentReviewDate, {
              'has valueAssessmentReviewDate date in current year': (s) => s!="" || s!=undefined
            });
          }

          if(body.data.targetMarket.fairValueAssessment.transactionCostsActualDate!=null)
          {
            check(body.data.targetMarket.fairValueAssessment.transactionCostsActualDate, {
              'has transactionCostsActualDate date in last year': (s) => s.includes(new Date().getFullYear()-1) 
            });
          }
  }); 
  targetMarketFairValueRespTime.add(res.timings.duration);
  targetMarketFairValueStats.add(1);
})

group('Verify Fair Value Analysis data from Mongo', function () {            
    const query = `query {
      targetMarket(identifier: "FUND:BBDRQK6") {
          fairValueAssessment {
            transactionCostsActual
            dataReportingValueForMoney
            outcomeOfPRINValueAssessmentOrReviewCode
            outcomeOfPRINValueAssessmentOrReview
            outcomeOfCOLLAssessmentOfValue
            outcomeOfCOLLAssessmentOfValueCode
          }
          fund360 {
            providesFairValue
            status
            totalScore
            costVsPerformance
            performance
            cost
            economyOfScale
            comparableMarketRates
            comparableServices
            assetClass
            reportLink
            
            importedDate
          }
        }
      }`;

    res = http.post(__ENV.ENDPOINT, JSON.stringify({ query: query }), {
      headers: headers.header1,
    });

    var body = JSON.parse(res.body);
    // console.log(body)

    check(res, {
      'is status 200': (r) => r.status === 200,
    });

    check(body.data.targetMarket.fairValueAssessment, {
      'has transactionCostsActual greater than or equal to 0': (fairValueAssessment) => fairValueAssessment.transactionCostsActual >= 0,
      'has dataReportingValueForMoney as boolean': (fairValueAssessment) => fairValueAssessment.dataReportingValueForMoney == true || fairValueAssessment.dataReportingValueForMoney == false,
      'has outcomeOfCOLLAssessmentOfValue with value': (fairValueAssessment) => fairValueAssessment.outcomeOfCOLLAssessmentOfValue == 'Charges are justified based on assessment and any action taken or, where the first assessment is not yet due, based on initial product design'
    });      
    check(body.data.targetMarket.fund360, {
      'has providesFairValue as boolean': (fund360) => fund360.providesFairValue == true || fund360.providesFairValue ==false ,
      'has status as Ret_3Y': (fund360) => fund360.status == 'Ret_3Y' ,
      'has totalScore greater than 0': (fund360) => fund360.totalScore > 0,
      'has costVsPerformance greater than 0': (fund360) => fund360.costVsPerformance > 0,
      'has cost greater than 0': (fund360) => fund360.cost > 0,
      'has economyOfScale greater than 0': (fund360) => fund360.economyOfScale > 0,
      'has comparableMarketRates greater than 0': (fund360) => fund360.comparableMarketRates > 0,
      'has comparableServices greater than 0': (fund360) => fund360.comparableServices > 0,
      'has assetClass with expected value': (fund360) => fund360.assetClass == 'Multi-Asset -> Conservative Allocation -> Global -> GBP'
    });      
}); 
}

export function handleSummary(data) {
  return {
    "GQLReports/targetMarketGQL Test.html": htmlReport(data),
     stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}