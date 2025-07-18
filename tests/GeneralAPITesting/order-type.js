import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group, fail, sleep } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";


var orderTypeRespTime = new Trend("custom_orderType_response_time");
var orderTypeStats = new Rate("custom_orderType_stats");

export const options = {
    thresholds: {
      checks: ['rate>=1']
    },
  };

export default function () {
    var config = {
        order_type: `${__ENV.ENDPOINT}/api/securities/instrument?marketCode=${__ENV.IDENTIFIER}`,
        device_token: 'YouInvestDeviceToken token=278bc838-b246-4fa7-b066-5e231ebc086e'
    };
    var response;

    if (__ENV.ENDPOINT === undefined) {
        fail("Environment: ENDPOINT must be set");
    }

    if (__ENV.IDENTIFIER === undefined) {
        fail("Environment: IDENTIFIER must be set");
    }

    group('Order Type', function () {
        let tokenParams = {
            headers: {
                'x-auth-ajb': config.device_token,
            },
            redirects: 0,
            responseType: "text"
        };

        response = http.get(
            config.order_type,
            tokenParams
        );

        var body = JSON.parse(response.body);
        let actualArray = new Array();
        let expectedArray = new Array();

        for (let i = 0; i < body.data.supportedOrderTypes.length; i++) {
            expectedArray[i] = body.data.supportedOrderTypes[i]
        }
        expectedArray.sort();
        var i = 0;
        actualArray[i] = 'MKT';
        if ((body.data.type != (2 || 6)) && (body.data.currencyCode == ('GBX' || 'GBP'))) {
            i++;
            actualArray[i] = 'LIM';
            i++;
            actualArray[i] = 'STO'; //Supports Limit and StopLoss now
        }
        actualArray.sort();

        for (let j = 0; j < expectedArray.length; j++) {
            check(expectedArray[j], {
                'has orderType': orderType => orderType == actualArray[j]
            });
        }

        orderTypeRespTime.add(response.timings.duration);
        orderTypeStats.add(1);
    });
}

export function handleSummary(data) {
    return {
      "Reports/order-type.html": htmlReport(data),
       stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}