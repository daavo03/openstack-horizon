# Licensed under the Apache License, Version 2.0 (the "License"); you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.

from django.conf.urls import include
from django.urls import re_path

from openstack_dashboard.dashboards.admin.volume_types.extras \
    import urls as extras_urls
from openstack_dashboard.dashboards.admin.volume_types.qos_specs \
    import urls as qos_specs_urls
from openstack_dashboard.dashboards.admin.volume_types \
    import views


urlpatterns = [
    re_path(r'^$', views.VolumeTypesView.as_view(), name='index'),
    re_path(r'^create_type$', views.CreateVolumeTypeView.as_view(),
            name='create_type'),
    re_path(r'^(?P<type_id>[^/]+)/update_type/$',
            views.EditVolumeTypeView.as_view(),
            name='update_type'),
    re_path(r'^create_qos_spec$', views.CreateQosSpecView.as_view(),
            name='create_qos_spec'),
    re_path(r'^(?P<type_id>[^/]+)/manage_qos_spec_association/$',
            views.ManageQosSpecAssociationView.as_view(),
            name='manage_qos_spec_association'),
    re_path(r'^(?P<qos_spec_id>[^/]+)/edit_qos_spec_consumer/$',
            views.EditQosSpecConsumerView.as_view(),
            name='edit_qos_spec_consumer'),
    re_path(r'^(?P<type_id>[^/]+)/extras/',
            include((extras_urls, 'extras'))),
    re_path(r'^(?P<volume_type_id>[^/]+)/create_type_encryption/$',
            views.CreateVolumeTypeEncryptionView.as_view(),
            name='create_type_encryption'),
    re_path(r'^(?P<volume_type_id>[^/]+)/update_type_encryption/$',
            views.UpdateVolumeTypeEncryptionView.as_view(),
            name='update_type_encryption'),
    re_path(r'^(?P<volume_type_id>[^/]+)/type_encryption_detail/$',
            views.VolumeTypeEncryptionDetailView.as_view(),
            name='type_encryption_detail'),
    re_path(r'^qos_specs/',
            include((qos_specs_urls, 'qos_specs'))),
    re_path(r'^(?P<volume_type_id>[^/]+)/edit_access/$',
            views.EditAccessView.as_view(), name='edit_access'),
]
