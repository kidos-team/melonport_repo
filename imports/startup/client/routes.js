import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

// Import to load these templates
import '/imports/ui/layouts/main.js';
import '/imports/ui/layouts/header.js';
import '/imports/ui/layouts/footer.js';
import '/imports/ui/pages/oracle.js';
import '/imports/ui/pages/liquidityprovider.js';
import '/imports/ui/pages/data.js';

// Default route
FlowRouter.route('/', {
  name: 'oracle',
  action() {
    BlazeLayout.render('layoutMain', {
      nav: 'layoutHeader',
      main: 'oracle',
      footer: 'layoutFooter',
    });
  },
});

FlowRouter.route('/oracle', {
  name: 'oracle',
  action() {
    BlazeLayout.render('layoutMain', {
      nav: 'layoutHeader',
      main: 'oracle',
      footer: 'layoutFooter',
    });
  },
});

FlowRouter.route('/liquidityprovider', {
  name: 'liquidityprovider',
  action() {
    BlazeLayout.render('layoutMain', {
      nav: 'layoutHeader',
      main: 'liquidityprovider',
      footer: 'layoutFooter',
    });
  },
});

FlowRouter.route('/data', {
  name: 'data',
  action() {
    BlazeLayout.render('layoutMain', {
      nav: 'layoutHeader',
      main: 'data',
      footer: 'layoutFooter',
    });
  },
});
