const Test = require('../config/testConfig.js');
const truffleAssert = require('truffle-assertions');
const BigNumber = require('bignumber.js');

let config;
let accounts;

const TEST_ORACLES_COUNT = 15;

// Watch contract events
const STATUS_CODE_ON_TIME = 10;

const oracles = [];

contract('Oracles', async (acc) => {
    accounts = acc;
});

before(async () => {
    config = await Test.Config(accounts);
});



it('register oracles succesfull', async () => {

    const fee = await config.flightSuretyApp.REGISTRATION_FEE.call({ from: accounts[1] });

    for (let a = 1; a < TEST_ORACLES_COUNT; a++) {

        if (!accounts[a]) break;

        await config.flightSuretyApp.registerOracle({
            from: accounts[a],
            value: fee
        });

        const indexes = await config.flightSuretyApp.getMyIndexes({from: accounts[a]});

        oracles.push({
            address: accounts[a],
            indexes
        });
    }
});

it('request flight status succesfull', async () => {

    const airline = config.firstAirline;
    const flight = 'ND1309';
    const timestamp = Math.floor(Date.now() / 1000);

    const oracleRequest = await config.flightSuretyApp.flightStatus(airline, flight, timestamp);

    let emittedIndex;

    truffleAssert.eventEmitted(oracleRequest, 'OracleRequest', (ev) => {
        emittedIndex = ev.index;
        return ev.flight === flight;
    });


    // Find matching oracles

    const relevantOracles = [];
    oracles.forEach((oracle) => {
        if ( BigNumber(oracle.indexes[0]).isEqualTo(emittedIndex) ) relevantOracles.push( oracle );
        if ( BigNumber(oracle.indexes[1]).isEqualTo(emittedIndex) ) relevantOracles.push( oracle );
        if ( BigNumber(oracle.indexes[2]).isEqualTo(emittedIndex) ) relevantOracles.push( oracle );
    });

    if (relevantOracles.length < 3) {
        console.warn("Not enough Oracles to pass, try running test again");
    }

    // One matching oracle should respond

    //console.log(relevantOracles[1]);

    const submitOracleResponse = await config.flightSuretyApp.submitOracleResponse(
        emittedIndex,
        airline,
        flight,
        timestamp,
        STATUS_CODE_ON_TIME,
        {from: relevantOracles[1].address}
    );

    truffleAssert.eventEmitted(submitOracleResponse, 'OracleReport', (ev) => {
        return ev.airline === airline && ev.flight === flight;
    });

});
