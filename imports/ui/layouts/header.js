import { Template } from 'meteor/templating';

import './header.html';

Template.layoutHeader.onRendered(() => {
  this.$('.button-collapse').sideNav({});
});
