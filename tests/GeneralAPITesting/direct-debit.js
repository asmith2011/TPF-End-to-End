import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group, fail, sleep } from 'k6';
import { initialise } from "../../commonUtil/common.js";
import { getToken } from "../../commonUtil/common.js";
import { login } from "../../commonUtil/common.js";
import { accountSummary } from "../../commonUtil/common.js";
import { logOut } from "../../commonUtil/common.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";


var directDebitRespTime = new Trend("custom_directDebit_response_time");
var directDebitStats = new Rate("custom_directDebit_stats");

const users = JSON.parse(open("../../data/direct-debit.json"));

export const options = {
    thresholds: {
      checks: ['rate>=1']
    },
  };

export default function () {

    var config = {
        direct_debit: `${__ENV.ENDPOINT}/api/bank-details/direct-debit?account=`,
        device_token: 'YouInvestDeviceToken token=278bc838-b246-4fa7-b066-5e231ebc086e'
    };
    var response;
    let accountsArray = new Array();

    if (__ENV.ENDPOINT === undefined) {
        fail("Environment: ENDPOINT must be set");
    }
    //initliase endpoints and other required variables
    initialise();

    //Generate ID token for each user login
    let user = users.users[__VU - 1];
    let password = users.password;
    let idToken = getToken(user, password,'web');

    //Login Functionality
    login(user,idToken);

    //Fetch all the accounts in an array for the given user
    accountsArray = accountSummary();

    group('Direct Debit', function () {
        let tokenParams = {
            headers: {
                'x-auth-ajb': config.device_token,
            },
            redirects: 0,
            responseType: "text"
        };

        for (let i = 0; i < accountsArray.length; i++) {
            let accountResponseURL = config.direct_debit + accountsArray[i];

            response = http.get(
                accountResponseURL,
                tokenParams
            );
            var body = JSON.parse(response.body);
            if (response.status == 200) {
                for (let i = 0; i < body.data.directDebits.length; i++) {
                    check(body.data.directDebits[i].productName, {
                        'has productName': prodName => prodName == 'Dealing account' || prodName == 'SIPP' || prodName == 'ISA' || prodName == 'Junior ISA' || prodName == 'Junior SIPP' || prodName == 'Lifetime ISA'
                    });
                    check(body.data.directDebits[i].productType, {
                        'has productType': prodType => prodType == '1' || prodType == '2' || prodType == '3' || prodType == '4' || prodType == '5' || prodType == '8'
                    });
                }
            }
            sleep(2);
            directDebitRespTime.add(response.timings.duration);
            directDebitStats.add(1);
        }
    });

    //Logout Functionality
    logOut();
}

export function handleSummary(data) {
    return {
      "Reports/direct-debit.html": htmlReport(data),
       stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}