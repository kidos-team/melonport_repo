var Web3 = require("web3");
var SolidityEvent = require("web3/lib/web3/event.js");

(function() {
  // Planned for future features, logging, etc.
  function Provider(provider) {
    this.provider = provider;
  }

  Provider.prototype.send = function() {
    this.provider.send.apply(this.provider, arguments);
  };

  Provider.prototype.sendAsync = function() {
    this.provider.sendAsync.apply(this.provider, arguments);
  };

  var BigNumber = (new Web3()).toBigNumber(0).constructor;

  var Utils = {
    is_object: function(val) {
      return typeof val == "object" && !Array.isArray(val);
    },
    is_big_number: function(val) {
      if (typeof val != "object") return false;

      // Instanceof won't work because we have multiple versions of Web3.
      try {
        new BigNumber(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    merge: function() {
      var merged = {};
      var args = Array.prototype.slice.call(arguments);

      for (var i = 0; i < args.length; i++) {
        var object = args[i];
        var keys = Object.keys(object);
        for (var j = 0; j < keys.length; j++) {
          var key = keys[j];
          var value = object[key];
          merged[key] = value;
        }
      }

      return merged;
    },
    promisifyFunction: function(fn, C) {
      var self = this;
      return function() {
        var instance = this;

        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {
          var callback = function(error, result) {
            if (error != null) {
              reject(error);
            } else {
              accept(result);
            }
          };
          args.push(tx_params, callback);
          fn.apply(instance.contract, args);
        });
      };
    },
    synchronizeFunction: function(fn, instance, C) {
      var self = this;
      return function() {
        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {

          var decodeLogs = function(logs) {
            return logs.map(function(log) {
              var logABI = C.events[log.topics[0]];

              if (logABI == null) {
                return null;
              }

              var decoder = new SolidityEvent(null, logABI, instance.address);
              return decoder.decode(log);
            }).filter(function(log) {
              return log != null;
            });
          };

          var callback = function(error, tx) {
            if (error != null) {
              reject(error);
              return;
            }

            var timeout = C.synchronization_timeout || 240000;
            var start = new Date().getTime();

            var make_attempt = function() {
              C.web3.eth.getTransactionReceipt(tx, function(err, receipt) {
                if (err) return reject(err);

                if (receipt != null) {
                  // If they've opted into next gen, return more information.
                  if (C.next_gen == true) {
                    return accept({
                      tx: tx,
                      receipt: receipt,
                      logs: decodeLogs(receipt.logs)
                    });
                  } else {
                    return accept(tx);
                  }
                }

                if (timeout > 0 && new Date().getTime() - start > timeout) {
                  return reject(new Error("Transaction " + tx + " wasn't processed in " + (timeout / 1000) + " seconds!"));
                }

                setTimeout(make_attempt, 1000);
              });
            };

            make_attempt();
          };

          args.push(tx_params, callback);
          fn.apply(self, args);
        });
      };
    }
  };

  function instantiate(instance, contract) {
    instance.contract = contract;
    var constructor = instance.constructor;

    // Provision our functions.
    for (var i = 0; i < instance.abi.length; i++) {
      var item = instance.abi[i];
      if (item.type == "function") {
        if (item.constant == true) {
          instance[item.name] = Utils.promisifyFunction(contract[item.name], constructor);
        } else {
          instance[item.name] = Utils.synchronizeFunction(contract[item.name], instance, constructor);
        }

        instance[item.name].call = Utils.promisifyFunction(contract[item.name].call, constructor);
        instance[item.name].sendTransaction = Utils.promisifyFunction(contract[item.name].sendTransaction, constructor);
        instance[item.name].request = contract[item.name].request;
        instance[item.name].estimateGas = Utils.promisifyFunction(contract[item.name].estimateGas, constructor);
      }

      if (item.type == "event") {
        instance[item.name] = contract[item.name];
      }
    }

    instance.allEvents = contract.allEvents;
    instance.address = contract.address;
    instance.transactionHash = contract.transactionHash;
  };

  // Use inheritance to create a clone of this contract,
  // and copy over contract's static functions.
  function mutate(fn) {
    var temp = function Clone() { return fn.apply(this, arguments); };

    Object.keys(fn).forEach(function(key) {
      temp[key] = fn[key];
    });

    temp.prototype = Object.create(fn.prototype);
    bootstrap(temp);
    return temp;
  };

  function bootstrap(fn) {
    fn.web3 = new Web3();
    fn.class_defaults  = fn.prototype.defaults || {};

    // Set the network iniitally to make default data available and re-use code.
    // Then remove the saved network id so the network will be auto-detected on first use.
    fn.setNetwork("default");
    fn.network_id = null;
    return fn;
  };

  // Accepts a contract object created with web3.eth.contract.
  // Optionally, if called without `new`, accepts a network_id and will
  // create a new version of the contract abstraction with that network_id set.
  function Contract() {
    if (this instanceof Contract) {
      instantiate(this, arguments[0]);
    } else {
      var C = mutate(Contract);
      var network_id = arguments.length > 0 ? arguments[0] : "default";
      C.setNetwork(network_id);
      return C;
    }
  };

  Contract.currentProvider = null;

  Contract.setProvider = function(provider) {
    var wrapped = new Provider(provider);
    this.web3.setProvider(wrapped);
    this.currentProvider = provider;
  };

  Contract.new = function() {
    if (this.currentProvider == null) {
      throw new Error("Exchange error: Please call setProvider() first before calling new().");
    }

    var args = Array.prototype.slice.call(arguments);

    if (!this.unlinked_binary) {
      throw new Error("Exchange error: contract binary not set. Can't deploy new instance.");
    }

    var regex = /__[^_]+_+/g;
    var unlinked_libraries = this.binary.match(regex);

    if (unlinked_libraries != null) {
      unlinked_libraries = unlinked_libraries.map(function(name) {
        // Remove underscores
        return name.replace(/_/g, "");
      }).sort().filter(function(name, index, arr) {
        // Remove duplicates
        if (index + 1 >= arr.length) {
          return true;
        }

        return name != arr[index + 1];
      }).join(", ");

      throw new Error("Exchange contains unresolved libraries. You must deploy and link the following libraries before you can deploy a new version of Exchange: " + unlinked_libraries);
    }

    var self = this;

    return new Promise(function(accept, reject) {
      var contract_class = self.web3.eth.contract(self.abi);
      var tx_params = {};
      var last_arg = args[args.length - 1];

      // It's only tx_params if it's an object and not a BigNumber.
      if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
        tx_params = args.pop();
      }

      tx_params = Utils.merge(self.class_defaults, tx_params);

      if (tx_params.data == null) {
        tx_params.data = self.binary;
      }

      // web3 0.9.0 and above calls new twice this callback twice.
      // Why, I have no idea...
      var intermediary = function(err, web3_instance) {
        if (err != null) {
          reject(err);
          return;
        }

        if (err == null && web3_instance != null && web3_instance.address != null) {
          accept(new self(web3_instance));
        }
      };

      args.push(tx_params, intermediary);
      contract_class.new.apply(contract_class, args);
    });
  };

  Contract.at = function(address) {
    if (address == null || typeof address != "string" || address.length != 42) {
      throw new Error("Invalid address passed to Exchange.at(): " + address);
    }

    var contract_class = this.web3.eth.contract(this.abi);
    var contract = contract_class.at(address);

    return new this(contract);
  };

  Contract.deployed = function() {
    if (!this.address) {
      throw new Error("Cannot find deployed address: Exchange not deployed or address not set.");
    }

    return this.at(this.address);
  };

  Contract.defaults = function(class_defaults) {
    if (this.class_defaults == null) {
      this.class_defaults = {};
    }

    if (class_defaults == null) {
      class_defaults = {};
    }

    var self = this;
    Object.keys(class_defaults).forEach(function(key) {
      var value = class_defaults[key];
      self.class_defaults[key] = value;
    });

    return this.class_defaults;
  };

  Contract.extend = function() {
    var args = Array.prototype.slice.call(arguments);

    for (var i = 0; i < arguments.length; i++) {
      var object = arguments[i];
      var keys = Object.keys(object);
      for (var j = 0; j < keys.length; j++) {
        var key = keys[j];
        var value = object[key];
        this.prototype[key] = value;
      }
    }
  };

  Contract.all_networks = {
  "3": {
    "abi": [
      {
        "constant": false,
        "inputs": [
          {
            "name": "id",
            "type": "uint256"
          }
        ],
        "name": "cancel",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "id",
            "type": "uint256"
          }
        ],
        "name": "getOffer",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "address"
          },
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "lastOfferId",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "id",
            "type": "uint256"
          }
        ],
        "name": "isActive",
        "outputs": [
          {
            "name": "active",
            "type": "bool"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "offers",
        "outputs": [
          {
            "name": "sell_how_much",
            "type": "uint256"
          },
          {
            "name": "sell_which_token",
            "type": "address"
          },
          {
            "name": "buy_how_much",
            "type": "uint256"
          },
          {
            "name": "buy_which_token",
            "type": "address"
          },
          {
            "name": "owner",
            "type": "address"
          },
          {
            "name": "active",
            "type": "bool"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "id",
            "type": "uint256"
          }
        ],
        "name": "getOwner",
        "outputs": [
          {
            "name": "owner",
            "type": "address"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "id",
            "type": "uint256"
          },
          {
            "name": "quantity",
            "type": "uint256"
          }
        ],
        "name": "buy",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "sell_how_much",
            "type": "uint256"
          },
          {
            "name": "sell_which_token",
            "type": "address"
          },
          {
            "name": "buy_how_much",
            "type": "uint256"
          },
          {
            "name": "buy_which_token",
            "type": "address"
          }
        ],
        "name": "offer",
        "outputs": [
          {
            "name": "id",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "id",
            "type": "uint256"
          }
        ],
        "name": "ItemUpdate",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sell_how_much",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "sell_which_token",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "buy_how_much",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "buy_which_token",
            "type": "address"
          }
        ],
        "name": "Trade",
        "type": "event"
      }
    ],
    "unlinked_binary": "0x606060405234610000575b610c1d806100186000396000f36060604052361561006c5760e060020a600035046340e58ee581146100715780634579268a14610095578063643268c9146100d657806382afd23b146100f55780638a72ea6a14610119578063c41a360a1461016a578063d6febde814610196578063f09ea2a6146101bd575b610000565b34610000576100816004356101e8565b604080519115158252519081900360200190f35b34610000576100a5600435610470565b60408051948552600160a060020a039384166020860152848101929092529091166060830152519081900360800190f35b34610000576100e36104aa565b60408051918252519081900360200190f35b34610000576100816004356104b0565b604080519115158252519081900360200190f35b34610000576101296004356104d2565b60408051968752600160a060020a039586166020880152868101949094529184166060860152909216608084015290151560a0830152519081900360c00190f35b346100005761017a60043561051b565b60408051600160a060020a039092168252519081900360200190f35b346100005761008160043560243561053c565b604080519115158252519081900360200190f35b34610000576100e36004356024356044356064356107c1565b60408051918252519081900360200190f35b6040805160c081018252600080825260208201819052918101829052606081018290526080810182905260a08101829052815460ff161561022857610000565b6000805460ff1916600117905582610247610242826104b0565b610a4c565b8361026d6102548261051b565b600160a060020a031633600160a060020a031614610a4c565b6001600086815260200190815260200160002060c06040519081016040529081600082015481526020016001820160009054906101000a9004600160a060020a0316600160a060020a03168152602001600282015481526020016003820160009054906101000a9004600160a060020a0316600160a060020a031681526020016004820160009054906101000a9004600160a060020a0316600160a060020a031681526020016004820160149054906101000a900460ff16151581526020015050925060016000868152602001908152602001600020600060008201600090556001820160006101000a815490600160a060020a03021916905560028201600090556003820160006101000a815490600160a060020a0302191690556004820160006101000a815490600160a060020a0302191690556004820160146101000a81549060ff021916905550506104358360200151600160a060020a031663a9059cbb856080015186600001516000604051602001526040518360e060020a0281526004018083600160a060020a0316815260200182815260200192505050602060405180830381600087803b156100005760325a03f115610000575050604051519050610a4c565b604080518681529051600080516020610bfd8339815191529181900360200190a1600193505b5b505b506000805460ff191690555b50919050565b600081815260016020819052604090912080549181015460028201546003830154600160a060020a0392831693919216905b509193509193565b60025481565b60008181526001602052604090206004015460a060020a900460ff165b919050565b600160208190526000918252604090912080549181015460028201546003830154600490930154600160a060020a039283169391929182169181169060a060020a900460ff1686565b600081815260016020526040902060040154600160a060020a03165b919050565b6040805160c081018252600080825260208201819052918101829052606081018290526080810182905260a081018290528154829060ff161561057e57610000565b6000805460ff191660011790558461059d610242826104b0565b610a4c565b600086815260016020818152604092839020835160c081018552815480825293820154600160a060020a03908116938201939093526002820154948101859052600382015483166060820152600490910154918216608082015260a060020a90910460ff16151560a0820152945090610617908790610a5c565b81156100005704915082604001518211806106325750825185115b1561064057600093506107ac565b8260400151821480156106535750825185145b156107075760008681526001602081815260408320838155918201805473ffffffffffffffffffffffffffffffffffffffff199081169091556002830193909355600382018054909316909255600401805474ffffffffffffffffffffffffffffffffffffffffff1916905560808401519084015160608501516106dd9291889133908790610a88565b604080518781529051600080516020610bfd8339815191529181900360200190a1600193506107ac565b6000821180156107175750600085115b156107a75782516107289086610bd5565b60008781526001602052604090819020919091558301516107499083610bd5565b60016000888152602001908152602001600020600201819055506106dd836080015186856020015133868860600151610a88565b604080518781529051600080516020610bfd8339815191529181900360200190a1600193506107ac565b600093505b5b506000805460ff191690555b505092915050565b6040805160c081018252600080825260208201819052918101829052606081018290526080810182905260a08101829052815460ff161561080157610000565b6000805460ff19166001178155869061081c90829010610a4c565b8461082981600010610a4c565b8661083e600160a060020a0382161515610a4c565b85610853600160a060020a0382161515610a4c565b888761087381600160a060020a031683600160a060020a03161415610a4c565b8b8752600160a060020a03808c166020890152604088018b9052898116606089015233166080880152600160a08801526108ab610bee565b975086600160008a81526020019081526020016000206000820151816000015560208201518160010160006101000a815481600160a060020a030219169083606060020a9081020402179055506040820151816002015560608201518160030160006101000a815481600160a060020a030219169083606060020a90810204021790555060808201518160040160006101000a815481600160a060020a030219169083606060020a90810204021790555060a08201518160040160146101000a81548160ff021916908360f860020a908102040217905550905050610a0b8b600160a060020a03166323b872dd33308b600001516000604051602001526040518460e060020a0281526004018084600160a060020a0316815260200183600160a060020a031681526020018281526020019350505050602060405180830381600087803b156100005760325a03f115610000575050604051519050610a4c565b604080518981529051600080516020610bfd8339815191529181900360200190a15b5b50505b505b505b505b506000805460ff191690555b50949350505050565b801515610a5857610000565b5b50565b6000828202610a7d841580610242575083858381156100005704145b610a4c565b8091505b5092915050565b610b0981600160a060020a03166323b872dd8589866000604051602001526040518460e060020a0281526004018084600160a060020a0316815260200183600160a060020a031681526020018281526020019350505050602060405180830381600087803b156100005760325a03f115610000575050604051519050610a4c565b610b7984600160a060020a031663a9059cbb85886000604051602001526040518360e060020a0281526004018083600160a060020a0316815260200182815260200192505050602060405180830381600087803b156100005760325a03f115610000575050604051519050610a4c565b80600160a060020a031684600160a060020a03167fa5ca35f5c7b1c108bbc4c25279f619f720805890f993005d9f00ef1e32663f9b8785604051808381526020018281526020019250505060405180910390a35b505050505050565b6000610be383831115610a4c565b508082035b92915050565b60028054600101908190555b9056de857d2761836ca6234345c7f7f4c783271ed7d1aedf9268b3fe32800d186fde",
    "events": {
      "0xde857d2761836ca6234345c7f7f4c783271ed7d1aedf9268b3fe32800d186fde": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "id",
            "type": "uint256"
          }
        ],
        "name": "ItemUpdate",
        "type": "event"
      },
      "0xa5ca35f5c7b1c108bbc4c25279f619f720805890f993005d9f00ef1e32663f9b": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sell_how_much",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "sell_which_token",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "buy_how_much",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "buy_which_token",
            "type": "address"
          }
        ],
        "name": "Trade",
        "type": "event"
      }
    },
    "updated_at": 1482327608450,
    "links": {},
    "address": "0x042ade8f38919c7218ee13ccd7d9db6402f39ba7"
  },
  "default": {
    "abi": [
      {
        "constant": false,
        "inputs": [
          {
            "name": "id",
            "type": "uint256"
          }
        ],
        "name": "cancel",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "id",
            "type": "uint256"
          }
        ],
        "name": "getOffer",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "address"
          },
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "lastOfferId",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "id",
            "type": "uint256"
          }
        ],
        "name": "isActive",
        "outputs": [
          {
            "name": "active",
            "type": "bool"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "offers",
        "outputs": [
          {
            "name": "sell_how_much",
            "type": "uint256"
          },
          {
            "name": "sell_which_token",
            "type": "address"
          },
          {
            "name": "buy_how_much",
            "type": "uint256"
          },
          {
            "name": "buy_which_token",
            "type": "address"
          },
          {
            "name": "owner",
            "type": "address"
          },
          {
            "name": "active",
            "type": "bool"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "id",
            "type": "uint256"
          }
        ],
        "name": "getOwner",
        "outputs": [
          {
            "name": "owner",
            "type": "address"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "id",
            "type": "uint256"
          },
          {
            "name": "quantity",
            "type": "uint256"
          }
        ],
        "name": "buy",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "sell_how_much",
            "type": "uint256"
          },
          {
            "name": "sell_which_token",
            "type": "address"
          },
          {
            "name": "buy_how_much",
            "type": "uint256"
          },
          {
            "name": "buy_which_token",
            "type": "address"
          }
        ],
        "name": "offer",
        "outputs": [
          {
            "name": "id",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "id",
            "type": "uint256"
          }
        ],
        "name": "ItemUpdate",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sell_how_much",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "sell_which_token",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "buy_how_much",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "buy_which_token",
            "type": "address"
          }
        ],
        "name": "Trade",
        "type": "event"
      }
    ],
    "unlinked_binary": "0x606060405234610000575b610c1d806100186000396000f36060604052361561006c5760e060020a600035046340e58ee581146100715780634579268a14610095578063643268c9146100d657806382afd23b146100f55780638a72ea6a14610119578063c41a360a1461016a578063d6febde814610196578063f09ea2a6146101bd575b610000565b34610000576100816004356101e8565b604080519115158252519081900360200190f35b34610000576100a5600435610470565b60408051948552600160a060020a039384166020860152848101929092529091166060830152519081900360800190f35b34610000576100e36104aa565b60408051918252519081900360200190f35b34610000576100816004356104b0565b604080519115158252519081900360200190f35b34610000576101296004356104d2565b60408051968752600160a060020a039586166020880152868101949094529184166060860152909216608084015290151560a0830152519081900360c00190f35b346100005761017a60043561051b565b60408051600160a060020a039092168252519081900360200190f35b346100005761008160043560243561053c565b604080519115158252519081900360200190f35b34610000576100e36004356024356044356064356107c1565b60408051918252519081900360200190f35b6040805160c081018252600080825260208201819052918101829052606081018290526080810182905260a08101829052815460ff161561022857610000565b6000805460ff1916600117905582610247610242826104b0565b610a4c565b8361026d6102548261051b565b600160a060020a031633600160a060020a031614610a4c565b6001600086815260200190815260200160002060c06040519081016040529081600082015481526020016001820160009054906101000a9004600160a060020a0316600160a060020a03168152602001600282015481526020016003820160009054906101000a9004600160a060020a0316600160a060020a031681526020016004820160009054906101000a9004600160a060020a0316600160a060020a031681526020016004820160149054906101000a900460ff16151581526020015050925060016000868152602001908152602001600020600060008201600090556001820160006101000a815490600160a060020a03021916905560028201600090556003820160006101000a815490600160a060020a0302191690556004820160006101000a815490600160a060020a0302191690556004820160146101000a81549060ff021916905550506104358360200151600160a060020a031663a9059cbb856080015186600001516000604051602001526040518360e060020a0281526004018083600160a060020a0316815260200182815260200192505050602060405180830381600087803b156100005760325a03f115610000575050604051519050610a4c565b604080518681529051600080516020610bfd8339815191529181900360200190a1600193505b5b505b506000805460ff191690555b50919050565b600081815260016020819052604090912080549181015460028201546003830154600160a060020a0392831693919216905b509193509193565b60025481565b60008181526001602052604090206004015460a060020a900460ff165b919050565b600160208190526000918252604090912080549181015460028201546003830154600490930154600160a060020a039283169391929182169181169060a060020a900460ff1686565b600081815260016020526040902060040154600160a060020a03165b919050565b6040805160c081018252600080825260208201819052918101829052606081018290526080810182905260a081018290528154829060ff161561057e57610000565b6000805460ff191660011790558461059d610242826104b0565b610a4c565b600086815260016020818152604092839020835160c081018552815480825293820154600160a060020a03908116938201939093526002820154948101859052600382015483166060820152600490910154918216608082015260a060020a90910460ff16151560a0820152945090610617908790610a5c565b81156100005704915082604001518211806106325750825185115b1561064057600093506107ac565b8260400151821480156106535750825185145b156107075760008681526001602081815260408320838155918201805473ffffffffffffffffffffffffffffffffffffffff199081169091556002830193909355600382018054909316909255600401805474ffffffffffffffffffffffffffffffffffffffffff1916905560808401519084015160608501516106dd9291889133908790610a88565b604080518781529051600080516020610bfd8339815191529181900360200190a1600193506107ac565b6000821180156107175750600085115b156107a75782516107289086610bd5565b60008781526001602052604090819020919091558301516107499083610bd5565b60016000888152602001908152602001600020600201819055506106dd836080015186856020015133868860600151610a88565b604080518781529051600080516020610bfd8339815191529181900360200190a1600193506107ac565b600093505b5b506000805460ff191690555b505092915050565b6040805160c081018252600080825260208201819052918101829052606081018290526080810182905260a08101829052815460ff161561080157610000565b6000805460ff19166001178155869061081c90829010610a4c565b8461082981600010610a4c565b8661083e600160a060020a0382161515610a4c565b85610853600160a060020a0382161515610a4c565b888761087381600160a060020a031683600160a060020a03161415610a4c565b8b8752600160a060020a03808c166020890152604088018b9052898116606089015233166080880152600160a08801526108ab610bee565b975086600160008a81526020019081526020016000206000820151816000015560208201518160010160006101000a815481600160a060020a030219169083606060020a9081020402179055506040820151816002015560608201518160030160006101000a815481600160a060020a030219169083606060020a90810204021790555060808201518160040160006101000a815481600160a060020a030219169083606060020a90810204021790555060a08201518160040160146101000a81548160ff021916908360f860020a908102040217905550905050610a0b8b600160a060020a03166323b872dd33308b600001516000604051602001526040518460e060020a0281526004018084600160a060020a0316815260200183600160a060020a031681526020018281526020019350505050602060405180830381600087803b156100005760325a03f115610000575050604051519050610a4c565b604080518981529051600080516020610bfd8339815191529181900360200190a15b5b50505b505b505b505b506000805460ff191690555b50949350505050565b801515610a5857610000565b5b50565b6000828202610a7d841580610242575083858381156100005704145b610a4c565b8091505b5092915050565b610b0981600160a060020a03166323b872dd8589866000604051602001526040518460e060020a0281526004018084600160a060020a0316815260200183600160a060020a031681526020018281526020019350505050602060405180830381600087803b156100005760325a03f115610000575050604051519050610a4c565b610b7984600160a060020a031663a9059cbb85886000604051602001526040518360e060020a0281526004018083600160a060020a0316815260200182815260200192505050602060405180830381600087803b156100005760325a03f115610000575050604051519050610a4c565b80600160a060020a031684600160a060020a03167fa5ca35f5c7b1c108bbc4c25279f619f720805890f993005d9f00ef1e32663f9b8785604051808381526020018281526020019250505060405180910390a35b505050505050565b6000610be383831115610a4c565b508082035b92915050565b60028054600101908190555b9056de857d2761836ca6234345c7f7f4c783271ed7d1aedf9268b3fe32800d186fde",
    "events": {
      "0xde857d2761836ca6234345c7f7f4c783271ed7d1aedf9268b3fe32800d186fde": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "id",
            "type": "uint256"
          }
        ],
        "name": "ItemUpdate",
        "type": "event"
      },
      "0xa5ca35f5c7b1c108bbc4c25279f619f720805890f993005d9f00ef1e32663f9b": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sell_how_much",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "sell_which_token",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "buy_how_much",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "buy_which_token",
            "type": "address"
          }
        ],
        "name": "Trade",
        "type": "event"
      }
    },
    "updated_at": 1482327282289
  }
};

  Contract.checkNetwork = function(callback) {
    var self = this;

    if (this.network_id != null) {
      return callback();
    }

    this.web3.version.network(function(err, result) {
      if (err) return callback(err);

      var network_id = result.toString();

      // If we have the main network,
      if (network_id == "1") {
        var possible_ids = ["1", "live", "default"];

        for (var i = 0; i < possible_ids.length; i++) {
          var id = possible_ids[i];
          if (Contract.all_networks[id] != null) {
            network_id = id;
            break;
          }
        }
      }

      if (self.all_networks[network_id] == null) {
        return callback(new Error(self.name + " error: Can't find artifacts for network id '" + network_id + "'"));
      }

      self.setNetwork(network_id);
      callback();
    })
  };

  Contract.setNetwork = function(network_id) {
    var network = this.all_networks[network_id] || {};

    this.abi             = this.prototype.abi             = network.abi;
    this.unlinked_binary = this.prototype.unlinked_binary = network.unlinked_binary;
    this.address         = this.prototype.address         = network.address;
    this.updated_at      = this.prototype.updated_at      = network.updated_at;
    this.links           = this.prototype.links           = network.links || {};
    this.events          = this.prototype.events          = network.events || {};

    this.network_id = network_id;
  };

  Contract.networks = function() {
    return Object.keys(this.all_networks);
  };

  Contract.link = function(name, address) {
    if (typeof name == "function") {
      var contract = name;

      if (contract.address == null) {
        throw new Error("Cannot link contract without an address.");
      }

      Contract.link(contract.contract_name, contract.address);

      // Merge events so this contract knows about library's events
      Object.keys(contract.events).forEach(function(topic) {
        Contract.events[topic] = contract.events[topic];
      });

      return;
    }

    if (typeof name == "object") {
      var obj = name;
      Object.keys(obj).forEach(function(name) {
        var a = obj[name];
        Contract.link(name, a);
      });
      return;
    }

    Contract.links[name] = address;
  };

  Contract.contract_name   = Contract.prototype.contract_name   = "Exchange";
  Contract.generated_with  = Contract.prototype.generated_with  = "3.2.0";

  // Allow people to opt-in to breaking changes now.
  Contract.next_gen = false;

  var properties = {
    binary: function() {
      var binary = Contract.unlinked_binary;

      Object.keys(Contract.links).forEach(function(library_name) {
        var library_address = Contract.links[library_name];
        var regex = new RegExp("__" + library_name + "_*", "g");

        binary = binary.replace(regex, library_address.replace("0x", ""));
      });

      return binary;
    }
  };

  Object.keys(properties).forEach(function(key) {
    var getter = properties[key];

    var definition = {};
    definition.enumerable = true;
    definition.configurable = false;
    definition.get = getter;

    Object.defineProperty(Contract, key, definition);
    Object.defineProperty(Contract.prototype, key, definition);
  });

  bootstrap(Contract);

  if (typeof module != "undefined" && typeof module.exports != "undefined") {
    module.exports = Contract;
  } else {
    // There will only be one version of this contract in the browser,
    // and we can use that.
    window.Exchange = Contract;
  }
})();
