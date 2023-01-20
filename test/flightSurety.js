const Test = require('../config/testConfig.js');
const truffleAssert = require('truffle-assertions');
const BigNumber = require('bignumber.js');

let config;
let accounts;
let firstAirline;
let secondAirline;
let thirdAirline;
let fourthAirline;
let fifthAirline;
let passenger;


contract('Flight Surety Tests', async (acc) => {
    
    accounts = acc;

    firstAirline = accounts[0];
    secondAirline = accounts[1];
    thirdAirline = accounts[2];
    fourthAirline = accounts[3];
    fifthAirline = accounts[4];

    passenger = accounts[5];
});


before(async () => {
    
    config = await Test.Config(accounts);
    await config.flightSuretyData.callerAuthorizationStatus(config.flightSuretyApp.address, true);
});


/**************** Settings **************/

it(`(multiparty) has correct initial isOperational() value`, async function () {
    
    let statusData =  await config.flightSuretyData.isOperational();
    assert.equal(statusData, true, "Error initial operating status value for flightSuretyData");
    
    let statusApp =  await config.flightSuretyApp.isOperational();
    assert.equal(statusApp, true, "Error initial operating status value for flightSuretyApp");
});

it('flightSuretyApp is authorised to make calls to flightSuretyData', async function () {
    const status = await config.flightSuretyData.getAuthorizationStatus(config.flightSuretyApp.address);
    assert.equal(status, true, "flightSuretyApp not authorized");
});


/***************** Airlines **************/

it('Contract owner is created as first airline', async function () {
    
    let fAirline = await config.flightSuretyData.getAirlineState(firstAirline); 
    assert.equal(fAirline, 2, "First airline");
});

it('Airlines can apply for registration', async function () {
    
    const airlineRegistration = await config.flightSuretyApp.airlineRegistration("Second Airline", { from: secondAirline });
    await config.flightSuretyApp.airlineRegistration("Third Airline", { from: thirdAirline });
    await config.flightSuretyApp.airlineRegistration("Fourth Airline", { from: fourthAirline });
    await config.flightSuretyApp.airlineRegistration("Fifth Airline", { from: fifthAirline });
    await config.flightSuretyApp.airlineRegistration("Fifth Airline", { from: accounts[5] });

    const currentState = 0;

    assert.equal(await config.flightSuretyData.getAirlineState(secondAirline), currentState, "Incorrect state for 2nd applied airline");
    assert.equal(await config.flightSuretyData.getAirlineState(thirdAirline), currentState, "Incorrect state for 3rd applied airline");
    assert.equal(await config.flightSuretyData.getAirlineState(fourthAirline), currentState, "Incorrect state for 4th applied airline");
    assert.equal(await config.flightSuretyData.getAirlineState(fifthAirline), currentState, "Incorrect state for 5th applied airline");

    truffleAssert.eventEmitted(airlineRegistration, 'AirlineApplied', (ev) => {
        return ev.airline === secondAirline;
    });
});

it('Paid airline can approve up to 4 applied airlines', async function () {
    
    const registrationApproval = await config.flightSuretyApp.registrationApproval(secondAirline, { from: firstAirline });
    await config.flightSuretyApp.registrationApproval(thirdAirline, { from: firstAirline });
    await config.flightSuretyApp.registrationApproval(fourthAirline, { from: firstAirline });

    const registeredState = 1;

    assert.equal(await config.flightSuretyData.getAirlineState(secondAirline), registeredState, "2nd registered airline incorrect state");
    assert.equal(await config.flightSuretyData.getAirlineState(thirdAirline), registeredState, "3rd registered airline incorrect state");
    assert.equal(await config.flightSuretyData.getAirlineState(fourthAirline), registeredState, "4th registered airline incorrect state");

    truffleAssert.eventEmitted(registrationApproval, 'AirlineRegistered', (ev) => {
        return ev.airline === secondAirline;
    });
});

it('Available airlines can pay dues', async function () {
    
    const payDues = await config.flightSuretyApp.payDues({ from: secondAirline, value: web3.utils.toWei('10', 'ether') });
    await config.flightSuretyApp.payDues({ from: thirdAirline, value: web3.utils.toWei('10', 'ether') });
    await config.flightSuretyApp.payDues({ from: fourthAirline, value: web3.utils.toWei('10', 'ether') });

    const paidState = 2;

    assert.equal(await config.flightSuretyData.getAirlineState(secondAirline), paidState, "2nd paid airline is of incorrect state");
    assert.equal(await config.flightSuretyData.getAirlineState(thirdAirline), paidState, "3rd paid airline is of incorrect state");
    assert.equal(await config.flightSuretyData.getAirlineState(fourthAirline), paidState, "4th paid airline is of incorrect state");

    truffleAssert.eventEmitted(payDues, 'AirlinePaid', (ev) => {
        return ev.airline === secondAirline;
    });

    const balance = await web3.eth.getBalance(config.flightSuretyData.address);
    const balanceEther = web3.utils.fromWei(balance, 'ether');

    assert.equal(balanceEther, 30, "Balance wasn't transferred");
});

it('Multiparty consensus for fifth airline registration', async function () {
    // Based on 4 paid airlines

    // Single airline approval should fail
    try {
        await config.flightSuretyApp.registrationApproval(fifthAirline, { from: firstAirline });
    } catch (err) {}
    assert.equal(await config.flightSuretyData.getAirlineState(fifthAirline), 0, "One airline can't approve 5th airline nregistration");

    // Fifth airline approval should pass
    const registrationApproval = await config.flightSuretyApp.registrationApproval(fifthAirline, { from: secondAirline });
    assert.equal(await config.flightSuretyData.getAirlineState(fifthAirline), 1, "5th registered airline is of incorrect state");

    truffleAssert.eventEmitted(registrationApproval, 'AirlineRegistered', (ev) => {
        return ev.airline === fifthAirline;
    });
});



/******************************** Flights ***********************************************/


/****************************** Passenger Insurance *************************************/

it('Passenger can buy insurance for flight', async function () {

    const amount = await config.flightSuretyApp.MAXIMUM_INSURANCE_AMOUNT.call();
    const flight1 = await config.flightSuretyApp.getFlight(0);

    const INSURANCE_DIVIDER = await config.flightSuretyApp.INSURANCE_DIVIDER.call();
    const expectedPayoutAmount = parseFloat(amount) + (parseFloat(amount)  / parseFloat(INSURANCE_DIVIDER) );

    await config.flightSuretyApp.purchaseInsurance(
        flight1.airline,
        flight1.flight,
        flight1.timestamp,
        { from: passenger, value: amount }
    );

    const insurance = await config.flightSuretyApp.getInsurance(flight1.flight, { from: passenger });

    assert.equal(parseFloat(insurance.payoutAmount), expectedPayoutAmount, "Insurance payout amount is incorrect");
});


it('Passenger cannot buy more than 1 ether for insurance', async function () {

    let amount = await config.flightSuretyApp.MAXIMUM_INSURANCE_AMOUNT.call();
    const flight1 = await config.flightSuretyApp.getFlight(0);

    let failed = false;

    try {
        await config.flightSuretyApp.purchaseInsurance(
            flight1.airline,
            flight1.flight,
            flight1.timestamp,
            { from: passenger, value: amount * 2}
        );
    } 
    catch (err) 
    {
        failed = true;
    }

    assert.equal(failed, true, "Passenger was able to purchase insurance of more than 1 ether");
});

it('Passenger can check the flight status', async function () {

    const flight1 = await config.flightSuretyApp.getFlight(0);

    const flightStatus = await config.flightSuretyApp.flightStatus(
        flight1.airline,
        flight1.flight,
        flight1.timestamp,
    );

    truffleAssert.eventEmitted(flightStatus, 'OracleRequest', (ev) => {
        return ev.airline === flight1.airline;
    });
});


