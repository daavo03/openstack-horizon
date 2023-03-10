# Copyright 2012 United States Government as represented by the
# Administrator of the National Aeronautics and Space Administration.
# All Rights Reserved.
#
# Copyright 2012 Nebula, Inc.
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


class Flavors(horizon.Panel):
    name = _("Flavors")
    slug = 'flavors'
    permissions = ('openstack.services.compute',)
    policy_rules = (("compute", "context_is_admin"),)

    def allowed(self, context):
        if (('compute' in settings.SYSTEM_SCOPE_SERVICES) !=
                bool(context['request'].user.system_scoped)):
            return False
        return super().allowed(context)
