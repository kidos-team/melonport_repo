import { Meteor } from 'meteor/meteor';

Meteor.methods({
  isServerConnected() {
    return web3.isConnected();
  },
});
