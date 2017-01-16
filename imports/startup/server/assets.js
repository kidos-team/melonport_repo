import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http'
import async from 'async';

import { Assets } from '/imports/api/assets.js';

import Registrar from '/imports/lib/assets/contracts/Registrar.sol.js';
import PreminedAsset from '/imports/lib/assets/contracts/PreminedAsset.sol.js';
import PriceFeed from '/imports/lib/assets/contracts/PriceFeed.sol.js';

import Helpers from '/imports/lib/assets/lib/Helpers.js';
import SolKeywords from '/imports/lib/assets/lib/SolKeywords.js';
import SolConstants from '/imports/lib/assets/lib/SolConstants.js';



Registrar.setProvider(web3.currentProvider);

const registrarContract = Registrar.at(Registrar.all_networks['3'].address);
PreminedAsset.setProvider(web3.currentProvider);
PriceFeed.setProvider(web3.currentProvider);

let numAssignedAssets;
registrarContract.numAssignedAssets()
  .then((result) => {
    numAssignedAssets = result.toNumber();
    console.log(`\n Num to Registar assigned assets: ${numAssignedAssets}`)

    // Inital updateAssets
    updateAssets();
  });


// FUNCTIONS
function updateAssets() {

  for (let index = 0; index < numAssignedAssets; index += 1) {
    let assetContract;
    let assetAddress;
    let assetName;
    let assetSymbol;
    let assetPrecision;
    let priceFeedContract;
    let priceFeedAddress;
    let priceFeedPrecision;
    let currentPrice;
    let lastUpdate;
    registrarContract.assetAt(index).then((result) => {
      assetAddress = result;
      assetContract = PreminedAsset.at(assetAddress);
      return assetContract.name();
    })
    .then((result) => {
      assetName = result;
      return assetContract.symbol();
    })
    .then((result) => {
      assetSymbol = result;
      return assetContract.precision();
    })
    .then((result) => {
      assetPrecision = result.toNumber();
      return registrarContract.priceFeedsAt(index);
    })
    .then((result) => {
      priceFeedAddress = result;
      priceFeedContract = PriceFeed.at(priceFeedAddress);
      return priceFeedContract.getPrecision();
    })
    .then((result) => {
      priceFeedPrecision = result.toNumber();
      return priceFeedContract.getPrice(assetAddress);
    })
    .then((result) => {
      currentPrice = result.toNumber();
      console.log(`\n Current Price: ${currentPrice}`)
      return priceFeedContract.lastUpdate();
    })
    .then((result) => {
      lastUpdate = result.toNumber();
      Assets.upsert({ assetAddress }, { $set: {
        address: assetAddress,
        name: assetName,
        symbol: assetSymbol,
        precision: assetPrecision,
        priceFeed: {
          address: priceFeedAddress,
          precision: priceFeedPrecision,
          price: currentPrice,
          timestamp: lastUpdate
        },
        createdAt: new Date(),
      } });
    });
  }
};

// EXECUTION
Meteor.startup(() => {
  // Set Price in regular time intervals
  // Meteor.setInterval(updateAssets, 2 * 60 * 1000);
});
