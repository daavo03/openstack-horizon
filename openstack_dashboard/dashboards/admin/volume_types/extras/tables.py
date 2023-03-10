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

from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from django.utils.translation import ngettext_lazy

from horizon import tables

from openstack_dashboard import api


class ExtraSpecDelete(tables.DeleteAction):

    @staticmethod
    def action_present(count):
        return ngettext_lazy(
            "Delete Extra Spec",
            "Delete Extra Specs",
            count
        )

    @staticmethod
    def action_past(count):
        return ngettext_lazy(
            "Deleted Extra Spec",
            "Deleted Extra Specs",
            count
        )

    def delete(self, request, obj_id):
        api.cinder.volume_type_extra_delete(request,
                                            self.table.kwargs['type_id'],
                                            [obj_id])


class ExtraSpecCreate(tables.LinkAction):
    name = "create"
    verbose_name = _("Create")
    url = "horizon:admin:volume_types:extras:create"
    classes = ("ajax-modal",)
    icon = "plus"

    def get_link_url(self, extra_spec=None):
        return reverse(self.url, args=[self.table.kwargs['type_id']])


class ExtraSpecEdit(tables.LinkAction):
    name = "edit"
    verbose_name = _("Edit")
    url = "horizon:admin:volume_types:extras:edit"
    classes = ("btn-edit", "ajax-modal")

    def get_link_url(self, extra_spec):
        return reverse(self.url, args=[self.table.kwargs['type_id'],
                                       extra_spec.key])


class ExtraSpecsTable(tables.DataTable):
    key = tables.Column('key', verbose_name=_('Key'))
    value = tables.Column('value', verbose_name=_('Value'))

    class Meta(object):
        name = "extras"
        verbose_name = _("Extra Specs")
        table_actions = (ExtraSpecCreate, ExtraSpecDelete)
        row_actions = (ExtraSpecEdit, ExtraSpecDelete)

    def get_object_id(self, datum):
        return datum.key

    def get_object_display(self, datum):
        return datum.key
