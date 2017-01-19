// Initialize web3 as global object for entire server side
import web3 from '/imports/lib/server/ethereum/web3.js';

// This defines all the collections, publications and methods that the application provides
// as an API to the client.
import '/imports/startup/server/register-apis.js';
import '/imports/startup/server/oracle.js';
import '/imports/startup/server/assets.js';
import '/imports/startup/server/liqprov.js';
import '/imports/startup/server/firstcapital.js';

// Set defaultAccount
web3.eth.defaultAccount = web3.eth.coinbase;
