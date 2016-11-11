import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

Meteor.startup(() => {
  Session.set('isServerConnected', true);
  Meteor.call('isServerConnected', (err, result) => {
    if(!err) {
      Session.set('isServerConnected', result);
    } else {
      console.log(err);
    }
  });
});

Template.registerHelper('isConnected', () => Session.get('isConnected'));
Template.registerHelper('isServerConnected', () => Session.get('isServerConnected'));
Template.registerHelper('latestBlock', () => Session.get('latestBlock'));
