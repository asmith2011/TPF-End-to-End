import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group, fail, sleep } from 'k6';

import { initialise } from "../../commonUtil/common.js";
import { getToken } from "../../commonUtil/common.js";
import { login } from "../../commonUtil/common.js";
import { logOut } from "../../commonUtil/common.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";


var activeOrdersRespTime = new Trend("custom_activeOrders_response_time");
var activeOrdersStats = new Rate("custom_activeOrders_stats");

export const options = {
    stages: [
        { duration: '2m', target: 30 },
        { duration: '2m', target: 40 },
        { duration: '5m', target: 60 },
        { duration: '1m', target: 20 },
    ],
    thresholds: {
        checks: ['rate>=1']
      },
};

const users = JSON.parse(open("../../data/active-orders.json"));

export default function () {

    if (__ENV.ENDPOINT === undefined) {
        fail("Environment: ENDPOINT must be set");
    }

    var config = {
        endpoint: `${__ENV.ENDPOINT}`,
        active_orders: `${__ENV.ENDPOINT}/api/account/active-orders?account=A61716D`,
        device_token: 'YouInvestDeviceToken token=278bc838-b246-4fa7-b066-5e231ebc086e'
    };

    var response;
    //initliase endpoints and other required variables
    initialise();

    //Generate ID token for each user login
    // let user = users.users[__VU - 1]; Change endpoint if need to have random users
    let user = 'YI303919'
    let password = users.password;
    let idToken = getToken(user, password,'web');
    login(user,idToken);

    group('Active Orders', function () {

        let tokenParams = {
            headers: {
                'x-auth-ajb': config.device_token,
            },
            redirects: 0,
            responseType: "text"
        };

        response = http.get(
            config.active_orders,
            tokenParams
        );

        check(response, {
            'is status 200': (r) => r.status === 200,
        });

        check(response, {
            'has body': (r) => r.body,
        });

        var body = JSON.parse(response.body);
        // console.log(body)

        for (let i = 0; i < body.data.orders.items.length; i++) {

            if (body.data.orders.items[i].instrument.type == '2' && body.data.orders.items[i].depot == 'COF' && body.data.orders.items[i].orderStatus != 'IV') {
                check(body.data.orders.items[i], {
                    'has no cancel button depot:COF and Type:Fund and OrderStatus: Not IV': (cnlStatusCheck) => cnlStatusCheck.allowCancel == false
                });
            }
            else if (body.data.orders.items[i].instrument.type == '2' && body.data.orders.items[i].depot != 'COF' && body.data.orders.items[i].orderStatus == 'IV') {
                check(body.data.orders.items[i], {
                    'has cancel button order status:IV and Type:Fund and Depot: Not COF': (cnlStatusCheck) => cnlStatusCheck.allowCancel == true
                });
            }
            else if ((body.data.orders.items[i].orderStatus == 'CND' || body.data.orders.items[i].orderStatus == 'IV') && body.data.orders.items[i].instrument.type != '6') {
                check(body.data.orders.items[i], {
                    'has cancel button for OrderStatus:CND/IV and Type:Other Than IPO': (cnlStatusCheck) => cnlStatusCheck.allowCancel == true
                });
            }
            else if (body.data.orders.items[i].orderStatus == 'CNL' && body.data.orders.items[i].instrument.type == '1') {
                check(body.data.orders.items[i], {
                    'has cancel button for OrderStatus:CNL and Type:Equity': (cnlStatusCheck) => cnlStatusCheck.allowCancel == true
                });
            }
            else {
                check(body.data.orders.items[i], {
                    'has no cancel button': (cnlStatusCheck) => cnlStatusCheck.allowCancel == false
                });
            }
        }
        sleep(2);
        activeOrdersRespTime.add(response.timings.duration);
        activeOrdersStats.add(1);
    });

    //Logout Functionality
    logOut();
}
export function handleSummary(data) {
    return {
      "Reports/active-order.html": htmlReport(data),
       stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}