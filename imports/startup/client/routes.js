import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

// Import to load these templates
import '../../ui/layouts/main.js';
import '../../ui/layouts/header.js';
import '../../ui/layouts/footer.js';
import '../../ui/pages/oracle.js';
import '../../ui/pages/liquidity.js';

// Default route
FlowRouter.route('/', {
  name: 'oracle',
  action() {
    BlazeLayout.render('layout_main', {
      nav: 'layout_header',
      main: 'oracle',
      footer: 'layout_footer',
    });
  },
});

FlowRouter.route('/oracle', {
  name: 'oracle',
  action() {
    BlazeLayout.render('layout_main', {
      nav: 'layout_header',
      main: 'oracle',
      footer: 'layout_footer',
    });
  },
});

FlowRouter.route('/liquidity', {
  name: 'liquidity',
  action() {
    BlazeLayout.render('layout_main', {
      nav: 'layout_header',
      main: 'liquidity',
      footer: 'layout_footer',
    });
  },
});
