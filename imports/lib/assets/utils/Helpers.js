var BigNumber = require('bignumber.js');
var SolConstants = require('./SolConstants.js');


exports.createAtomizedPrices = function(data) {
  return [
    data[0] * SolConstants.BITCOINTOKEN_ATOMIZE,
    data[1] * SolConstants.DOLLARTOKEN_ATOMIZE,
    data[2] * SolConstants.EUROTOKEN_ATOMIZE
  ];
};

// Set price of fungible relative to Ether
/** Ex:
 *  Let asset == UST, let Value of 1 UST := 1 USD == 0.118343195 ETH
 *  and let precision == 8,
 *  => assetPrices[UST] = 11834319
 */
exports.createInverseAtomizedPrices = function(data) {
  return [
    1.0 / data[0] * SolConstants.BITCOINTOKEN_OUTSTANDING_PRECISION,
    1.0 / data[1] * SolConstants.DOLLARTOKEN_OUTSTANDING_PRECISION,
    1.0 / data[2] * SolConstants.EUROTOKEN_OUTSTANDING_PRECISION
  ];
};
