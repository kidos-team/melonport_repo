import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

// Import to load these templates
import '../../ui/layouts/main.js';
import '../../ui/layouts/header.js';
import '../../ui/layouts/footer.js';
import '../../ui/pages/data.js';

// Default route
FlowRouter.route('/', {
  name: 'data',
  action() {
    BlazeLayout.render('layout_main', {
      nav: 'layout_header',
      main: 'data',
      footer: 'layout_footer',
    });
  },
});

FlowRouter.route('/data', {
  name: 'data',
  action() {
    BlazeLayout.render('layout_main', {
      nav: 'layout_header',
      main: 'data',
      footer: 'layout_footer',
    });
  },
});
