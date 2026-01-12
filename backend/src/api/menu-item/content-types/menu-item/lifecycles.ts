/**
 * Menu Item Lifecycle Hooks
 * Logs actions for menu item changes
 */

import { createAdminLifecycles } from '../../../../utils/lifecycle-helpers';

export default createAdminLifecycles('menu_item', {
  apiName: 'menu-item',
});
