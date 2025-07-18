import http from 'k6/http';
import { Trend, Rate } from "k6/metrics";
import { check, group, fail, sleep } from 'k6';

import { initialise } from "../../commonUtil/common.js";
import { getToken } from "../../commonUtil/common.js";
import { login } from "../../commonUtil/common.js";
import { logOut } from "../../commonUtil/common.js";
import { userDetails } from "../../commonUtil/common.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";


var availableProductsRespTime = new Trend("custom_availableProducts_response_time");
var availableProductsStats = new Rate("custom_availableProducts_stats");

export const options = {
    stages: [
        { duration: '2m', target: 30 },
        // { duration: '2m', target: 40 },
        // { duration: '5m', target: 60 },
        // { duration: '1m', target: 20 },
    ],
    thresholds: {
        checks: ['rate>=1']
      },
};

const users = JSON.parse(open("../../data/available-products.json"));

export default function () {

    if (__ENV.ENDPOINT === undefined) {
        fail("Environment: ENDPOINT must be set");
    }

    var config = {
        endpoint: `${__ENV.ENDPOINT}`,
        available_Products: `${__ENV.ENDPOINT}/api/additional-products/available-products`,
        device_token: 'YouInvestDeviceToken token=278bc838-b246-4fa7-b066-5e231ebc086e'
    };

    var response;
    //initliase endpoints and other required variables
    initialise();

    //Generate ID token for each user login
    let user = users.users[__VU - 1];
    let password = users.password;
    let idToken = getToken(user, password,'mobile');
    login(user,idToken);
    
    let usrDetails = JSON.parse(userDetails());
    
    group('Available Products', function () {
        let tokenParams = {
            headers: {
                'x-auth-ajb': config.device_token,
            },
            redirects: 0,
            responseType: "text"
        };

        response = http.get(
            config.available_Products,
            tokenParams
        );

        check(response, {
            'is status 200': (r) => r.status === 200,
        });

        check(response, {
            'has body': (r) => r.body,
        });

        var body = JSON.parse(response.body);

        var products = body.data.products.map( function(pr) {
            return pr.label;
        });

        console.log(products)

        if(usrDetails.data.fatca.countryCitizenship == 'United Kingdom'|| usrDetails.data.fatca.countryCitizenship2 == 'United Kingdom' 
        || usrDetails.data.fatca.countryPermResTax == 'United Kingdom' || usrDetails.data.fatca.countryPermResTax2 == 'United Kingdom'){
            check(products, {    
                    'Check Product': (products) => JSON.stringify(products) === JSON.stringify(["sipp","isa","lisa","saving"]),
                    // Duplicate assertions of above
                    // 'Check saving account product exist': (products) => products.includes("saving") === true,
                    // 'Check isa account product exist': (products) => products.includes("sipp") === true,
                    // 'Check dealing account product exist': (products) => products.includes("dealing") === true,
                });
        }
        else if(usrDetails.data.fatca.countryCitizenship == 'United States'|| usrDetails.data.fatca.countryCitizenship2 == 'United States' 
        || usrDetails.data.fatca.countryPermResTax == 'United States' || usrDetails.data.fatca.countryPermResTax2 == 'United States'){
            check(products, {    
                    'Check Product': (products) => JSON.stringify(products) === JSON.stringify(["dealing","sipp","saving"]),
                    'Check isa product doesnt exist': (products) => products.includes("isa") === false,
                    'Check dealing product doesnt exist': (products) => products.includes("dealing") === false,
                    'Check lisa product doesnt exist': (products) => products.includes("lisa") === false,
                    'Check jisa product doesnt exist': (products) => products.includes("jisa") === false
                });
        }
        else if(usrDetails.data.fatca.countryCitizenship == 'Canada'|| usrDetails.data.fatca.countryCitizenship2 == 'Canada' 
        || usrDetails.data.fatca.countryPermResTax == 'Canada' || usrDetails.data.fatca.countryPermResTax2 == 'Canada'){
            check(products, {    
                    'Check Product': (products) => JSON.stringify(products) === JSON.stringify(["dealing","sipp","saving"]),
                    'Check isa product doesnt exist': (products) => products.includes("isa") === false,
                    'Check dealing product doesnt exist': (products) => products.includes("dealing") === false,
                    'Check lisa product doesnt exist': (products) => products.includes("lisa") === false,
                    'Check jisa product doesnt exist': (products) => products.includes("jisa") === false,
                    'Check sipp product doesnt exist': (products) => products.includes("sipp") === false,
                    'Check jsipp product doesnt exist': (products) => products.includes("jsipp") === false
                });
        }
        sleep(2);
        availableProductsRespTime.add(response.timings.duration);
        availableProductsStats.add(1);
    });

    //Logout Functionality
    logOut();
}

export function handleSummary(data) {
    return {
      "Reports/available-products.html": htmlReport(data),
       stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}