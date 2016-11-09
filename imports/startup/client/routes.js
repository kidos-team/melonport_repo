import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

// Import to load these templates
import '../../ui/layouts/main.js';
import '../../ui/layouts/header.js';
import '../../ui/layouts/footer.js';
import '../../ui/pages/daemon.js';

// Default route
FlowRouter.route('/', {
  name: 'daemon',
  action() {
    BlazeLayout.render('layout_main', {
      nav: 'layout_header',
      main: 'daemon',
      footer: 'layout_footer',
    });
  },
});
