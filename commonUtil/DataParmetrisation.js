import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { SharedArray } from 'k6/data';

// not using SharedArray here will mean that the code in the function call (that is what loads and
// parses the csv) will be executed per each VU which also means that there will be a complete copy
// per each VU

if (__ENV.INPUTFILE === undefined) {
  fail("Environment: ENDDATE must be set");
}

var inputFile = "..//data//csvData//" + __ENV.INPUTFILE + ".csv"

const csvData = new SharedArray('another data name', function () {
  // Load CSV file and parse it using Papa Parse
  return papaparse.parse(open(inputFile), { header: true }).data;
});

export function getCSVData() {
  return csvData;
};

