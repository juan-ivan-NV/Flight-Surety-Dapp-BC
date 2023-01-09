## Project Requirements
There are five main requirements for the project:

### 1.- Separation of Concerns: 

* FlightSuretyData contract for data persistence.
* FlightSuretyApp contract for app logic and oracles code.
* Dapp client for triggering contract calls.
* Server app for simulating oracles.

### 2.- Airlines

* Register first airline when contract is deployed.
* Only existing airline may register a new airline until there are at least four airlines registered.
* Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registrated airlines.
* Airline can be registered, but does not participate in contract until it submits funding of 10 ether.

### 3.- Passengers

* Passengers may pay upto 1 ether for purchasing flight insurance.
* Flight numbers and timestamps are fixed for the purpose of the project and can be defined in the Dapp client.
* If the flight is delayed due to to airline fault, passenger receives credit of 1.5X the amount they paid.
* Funds are transfered from contract to the passenger wallet only when they initiate a withdrawal.

### 4.- Oracles

* Oracles are implemented as a server app.
* Upon startup, 20+ oracles are registered and their assigned indexes are persisted in memory.
* Client dapp is used to trigger request to update flight status generating OracleRequest event that is captured by server.
* Server will loop through all registered oracles, identify those oracles for which the request applies, and respond by calling into app logic contract with the appropriate status code.

### 5.- General

* Contracts must have operational status control.
* Functions must fail fast - use require() at the start of functions.
* Scaffolding code is provided but you are free to replace it qith your own code.
* Have fun learning!


# How to deploy this project using Docker?

### Installing...

<code>docker build -t flight1 .</code><br />
<code>docker run -t -d -p 9545:9545 -p 8000:8000 flight1</code>

### Running inside the container ...

you may want to se the container ID 

<code>docekr ps</code>

Get iside the container

<code>docker exec -it [contaner id] bash</code>

once inside the container run truffle

<code>truffle develop</code>
<code>compile</code>e3
<code>migrate --reset</code>

try to run testings again of some test fails
<code>test</code>

### runnig the app

I recommend you to open a new terminal window and type

<code>npm run dapp</code>


http://localhost:8000/


### Depelop server

first reset truffle artifacts

<code>truffle develop</code>

you can test oracles (you may try a few times if you can't get to pass all testings)

<code>truffle test test/oracles.js</code>



