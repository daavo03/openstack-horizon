# Copyright 2012 NEC Corporation
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

from django.urls import re_path

from openstack_dashboard.dashboards.admin.networks.ports import views
from openstack_dashboard.dashboards.admin.networks.ports.extensions. \
    allowed_address_pairs import views as addr_pairs_views

PORTS = r'^(?P<port_id>[^/]+)/%s$'


urlpatterns = [
    re_path(PORTS % 'detail', views.DetailView.as_view(), name='detail'),
    re_path(PORTS % 'addallowedaddresspairs',
            addr_pairs_views.AddAllowedAddressPair.as_view(),
            name='addallowedaddresspairs'),
]
