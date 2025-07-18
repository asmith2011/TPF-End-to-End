import http from 'k6/http';
import { Trend } from "k6/metrics";
import { check, group, fail, sleep } from 'k6';
import { initialise,getToken } from "../../commonUtil/common.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

var WatchlistsOverviewRespTime = new Trend("custom_watchlists_overview_response_time");
var getWatchlistsRespTime = new Trend("custom_get_watchlists_response_time");
var getWatchlistRespTime = new Trend("custom_get_watchlist_response_time");
var createwatchlistRespTime = new Trend("custom_create_watchlist_response_time");
var updatewatchlistRespTime = new Trend("custom_update_watchlist_response_time");
var deletewatchlistRespTime = new Trend("custom_delete_watchlist_response_time");
var createItemRespTime = new Trend("custom_create_item_response_time");
var updateItemRespTime = new Trend("custom_update_item_response_time");
var deleteItemRespTime = new Trend("custom_delete_item_response_time");

export const options = {
    stages: [
        { duration: '1m', target: 1 },
        // { duration: '2m', target: 40 },
        // { duration: '5m', target: 60 },
        // { duration: '1m', target: 20 },
    ],
    thresholds: {
        http_req_failed: ['rate<0.1'], // http errors should be less than 10%
        http_req_duration: ['p(95)<6000'], // 95% of requests should be below 2000ms
      },
};

const users = JSON.parse(open("../../data/load-test-accounts.json"));
var config = {
    endpoint: `${__ENV.ENDPOINT}`,
    get_watchlists: `${__ENV.ENDPOINT}apiv2/watchlists/index/get-watchlists`,
    get_watchlist: `${__ENV.ENDPOINT}apiv2/watchlists/index/get-watchlist`,
    watchlists_overview: `${__ENV.ENDPOINT}apiv2/watchlists/index/watchlists-overview`,
    create_watchlist: `${__ENV.ENDPOINT}apiv2/watchlists/index/create-watchlist`,
    update_watchlist: `${__ENV.ENDPOINT}apiv2/watchlists/index/update-watchlist`,
    delete_watchlist: `${__ENV.ENDPOINT}apiv2/watchlists/index/delete-watchlist`,
    create_item: `${__ENV.ENDPOINT}apiv2/watchlists/index/insert-item`,
    update_item: `${__ENV.ENDPOINT}apiv2/watchlists/index/update-item`,
    delete_item: `${__ENV.ENDPOINT}apiv2/watchlists/index/delete-item`,
    client: 'web',
    device_token: 'YouInvestDeviceToken token=278bc838-b246-4fa7-b066-5e231ebc086e'
};
var response;

var watchlistID;
var itemID;

export default function () {

    let user = users.users[Math.floor(Math.random() * users.users.length)]   
    let password = users.password;

    if (__ENV.ENDPOINT === undefined) {
        fail("Environment: ENDPOINT must be set");
    }

    
    initialise();
    let idToken = getToken(user, password,config.client);

    // group('Watchlist Overview', function (){
    //     watchlistsOverview(idToken) 
    //     getWatchlists(idToken) 
    // })

    // group('CRUD Watchlist', function (){
    //     getWatchlists(idToken)
    //     createWatchlist(idToken)
    //     updateWatchlist(watchlistID,idToken)
    //     deleteWatchlist(watchlistID,idToken)
    // })

    group('CRUD Watchlist Item', function (){
        getWatchlists(idToken) 
        createWatchlist(idToken)
        createItem(watchlistID,idToken)
        getWatchlist_id(watchlistID,idToken)
        updateItem(itemID,idToken)
        deleteItem(itemID,idToken)
    })
}

export function watchlistsOverview(idToken){
    let tokenParams = {
        headers: {
            'Authorization': `Bearer ${idToken}`,
        },
        redirects: 0,
        responseType: "text"
    };

    response = http.get(
        `${config.watchlists_overview}`,
        tokenParams
    );
    check(response, {
        'watchlistsOverview has status 200': (r) => r.status === 200,
    });

    check(response, {
        'watchlistsOverview body size is not 0': (r) => r.body.length > 1,
    });  
    WatchlistsOverviewRespTime.add(response.timings.duration);
    if(response.status!==200){
        logError(response)
    }
}

export function getWatchlists(idToken) {
    let tokenParams = {
        headers: {
            'Authorization': `Bearer ${idToken}`,
        },
        redirects: 0,
        responseType: "text"
    };

    response = http.get(
        `${config.get_watchlists}`,
        tokenParams
    );
    check(response, {
        'getWatchlists has status 200': (r) => r.status === 200,
    });

    check(response, {
        'getWatchlists body size is not 0': (r) => r.body.length > 1,
    });  
    getWatchlistsRespTime.add(response.timings.duration);
    var body = JSON.parse(response.body);
    if(JSON.stringify(body).includes('id')){
        deleteWatchlist(body[0].id,idToken)
    }
    if(response.status!==200){
        logError(response)
    }
}

export function createWatchlist (idToken) {
        let data = { name: 'LoadTest' };
        let tokenParams = {
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json' 
            },
            redirects: 0,
            responseType: "text"
        };

        response = http.post(
            `${config.create_watchlist}`,
            JSON.stringify(data),
            tokenParams
        );
        check(response, {
            'createWatchlist has status 201': (r) => r.status === 201,
        });

        check(response, {
            'createWatchlist body size is not 0': (r) => r.body.length > 1,
        });  
        createwatchlistRespTime.add(response.timings.duration);
        var body = JSON.parse(response.body);
        watchlistID=body.id
        if(response.status!==201){
                    logError(response)
                }
}

export function getWatchlist_id (id,idToken) {
        let tokenParams = {
            headers: {
                'Authorization': `Bearer ${idToken}`,
            },
            redirects: 0,
            responseType: "text"
        };

        response = http.get(
            `${config.get_watchlist}?id=${id}`,
            tokenParams
        );
        check(response, {
            'getWatchlist_id has status 200': (r) => r.status === 200,
        });

        check(response, {
            'getWatchlist_id body size is not 0': (r) => r.body.length > 1,
        });  
        getWatchlistRespTime.add(response.timings.duration);
        var body = JSON.parse(response.body);
        itemID=body.items[0].id
        if(response.status!==200){
            logError(response)
        }
        if(response.status!=200){
            logError(response)
        }
}

export function createItem(id,idToken) {
        let data = {
            "watchlistId": `${id}`,
            "marketCode": 'LSE:WTAN',
            "price": 100,
            "quantity": 100,
            "notes": 'K6TestItem'
        };
        let tokenParams = {
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json' 
            },
            redirects: 0,
            responseType: "text"
        };

        response = http.post(
            `${config.create_item}`,
            JSON.stringify(data),
            tokenParams
        );
        
        check(response, {
            'createItem has status 201': (r) => r.status === 201,
        });

        check(response, {
            'createItem body size is not 0': (r) => r.body.length > 1,
        });  
        createItemRespTime.add(response.timings.duration);
        if(response.status!==201){
            logError(response)
        }
        
}

export function updateItem(itemID,idToken) {
        let data = {
            "id": `${itemID}`,
            "price": 110,
            "quantity": 110,
            "notes": "UpdatedItem"
          };
        let tokenParams = {
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json' 
            },
            redirects: 0,
            responseType: "text"
        };

        response = http.put(
            `${config.update_item}`,
            JSON.stringify(data),
            tokenParams
        );
        var body = JSON.parse(response.body);
        check(response, {
            'updateItem has status 200': (r) => r.status === 200,
        });

        check(body, {
            'updateItem has success in body': (r) => body.success == true,
        });   
        updateItemRespTime.add(response.timings.duration);
        if(response.status!==200){
            logError(response)
        }
}

export function deleteItem(itemID,idToken) {
        let data = { id: `${itemID}` };
        let tokenParams = {
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json' 
            },
            redirects: 0,
            responseType: "text"
        };

        response = http.del(
            `${config.delete_item}`,
            JSON.stringify(data),
            tokenParams
        );
        var body = JSON.parse(response.body);
        check(response, {
            'deleteItem has status 200': (r) => r.status === 200,
        });

        check(body, {
            'deleteItem has success in body': (r) => body.success == true,
        }); 
        deleteItemRespTime.add(response.timings.duration);
        if(response.status!==200){
            logError(response)
        }
}

export function updateWatchlist (id,idToken) {
        let data = { name: "Updatedk6WL",id: `${id}` };
        let tokenParams = {
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json' 
            },
            redirects: 0,
            responseType: "text"
        };

        response = http.put(
            `${config.update_watchlist}`,
            JSON.stringify(data),
            tokenParams
        );
        var body = JSON.parse(response.body);
        check(response, {
            'updateWatchlist has status 200': (r) => r.status === 200,
        });

        check(body, {
            'updateWatchlist has success in body': (r) => body.success == true,
        });   
        updatewatchlistRespTime.add(response.timings.duration);
        if(response.status!==200){
            logError(response)
        }
}

export function deleteWatchlist(id,idToken){
    let data = { id: `${id}` };
    let tokenParams = {
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json' 
                },
                redirects: 0,
                responseType: "text"
            };
    var resp = http.del(
                `${__ENV.ENDPOINT}apiv2/watchlists/index/delete-watchlist`,
                JSON.stringify(data),
                tokenParams)
    if(resp.status!=200){
        logError(resp)
    }
    var body = JSON.parse(resp.body);
    check(resp, {
        'deleteWatchlist has status 200': (r) => r.status === 200,
    });
    check(body, {
        'deleteWatchlist has success in body': (r) => body.success == true,
    }); 
    deletewatchlistRespTime.add(resp.timings.duration);
}

export function logError(resp){
    console.log(`Request to ${resp.request.url} with status ${resp.status}`);
    console.log(`Request body \n${JSON.stringify(resp.request.body)}`);
    console.log(`Resp body \n${JSON.stringify(resp.body)}`);
}

export function handleSummary(data) {
    return {
      "Reports/Watchlist.html": htmlReport(data),
       stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}