# Copyright 2012,  Nachi Ueno,  NTT MCL,  Inc.
#
#    Licensed under the Apache License, Version 2.0 (the "License"); you may
#    not use this file except in compliance with the License. You may obtain
#    a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
#    WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
#    License for the specific language governing permissions and limitations
#    under the License.

from django.conf import settings
from django.utils.translation import gettext_lazy as _

import horizon

from openstack_dashboard.utils import settings as setting_utils


class Routers(horizon.Panel):
    name = _("Routers")
    slug = 'routers'
    permissions = ('openstack.services.network',)
    policy_rules = (("network", "context_is_admin"),)

    @staticmethod
    def can_register():
        return setting_utils.get_dict_config(
            'OPENSTACK_NEUTRON_NETWORK', 'enable_router')

    def allowed(self, context):
        if (('network' in settings.SYSTEM_SCOPE_SERVICES) !=
                bool(context['request'].user.system_scoped)):
            return False
        return super().allowed(context)
