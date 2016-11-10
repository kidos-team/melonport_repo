import { Transactions } from '/imports/api/transactions.js';

import { HTTP } from 'meteor/http'

import PriceFeedAsset from '/imports/lib/assets/PriceFeed.sol.js';

const ABI = PriceFeedAsset.all_networks['2'].abi;
const DEPLOYED_AT = PriceFeedAsset.all_networks['2'].address;
