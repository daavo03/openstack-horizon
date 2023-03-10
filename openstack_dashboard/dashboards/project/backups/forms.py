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


"""
Views for managing backups.
"""

import operator

from django.urls import reverse
from django.utils.translation import gettext_lazy as _

from horizon import exceptions
from horizon import forms
from horizon import messages

from openstack_dashboard import api
from openstack_dashboard.dashboards.project.containers \
    import utils as containers_utils


class CreateBackupForm(forms.SelfHandlingForm):
    name = forms.CharField(max_length=255, label=_("Backup Name"))
    description = forms.CharField(widget=forms.Textarea(attrs={'rows': 4}),
                                  label=_("Description"),
                                  required=False)
    container_name = forms.CharField(
        max_length=255,
        label=_("Container Name"),
        validators=[containers_utils.no_slash_validator],
        required=False)
    volume_id = forms.CharField(widget=forms.HiddenInput())
    snapshot_id = forms.ThemableChoiceField(label=_("Backup Snapshot"),
                                            required=False)
    incremental = forms.BooleanField(
        label=_("Incremental"),
        required=False,
        help_text=_("By default, a backup is created as a full backup. "
                    "Check this to do an incremental backup from latest "
                    "backup. Only available if a prior backup exists."))

    def __init__(self, request, *args, **kwargs):
        super().__init__(request, *args, **kwargs)
        search_opts = {"volume_id": kwargs['initial']['volume_id'],
                       "status": "available"}
        try:
            if not api.cinder.volume_backup_list(request,
                                                 search_opts=search_opts):
                self.fields.pop('incremental')
        except Exception:
            #  Do not include incremental if list of prior backups fails
            self.fields.pop('incremental')
            msg = _('Unable to retrieve volume backup list '
                    'for volume "%s", so incremental '
                    'backup is disabled.') % search_opts['volume_id']

            exceptions.handle(self.request, msg)

        if kwargs['initial'].get('snapshot_id'):
            snap_id = kwargs['initial']['snapshot_id']
            try:
                snapshot = api.cinder.volume_snapshot_get(request, snap_id)
                self.fields['snapshot_id'].choices = [(snapshot.id,
                                                       snapshot.name)]
                self.fields['snapshot_id'].initial = snap_id
            except Exception:
                redirect = reverse('horizon:project:snapshots:index')
                exceptions.handle(request, _('Unable to fetch snapshot'),
                                  redirect=redirect)
        else:
            try:
                sop = {'volume_id': kwargs['initial']['volume_id']}
                snapshots = api.cinder.volume_snapshot_list(request,
                                                            search_opts=sop)

                snapshots.sort(key=operator.attrgetter('id', 'created_at'))
                snapshotChoices = [[snapshot.id, snapshot.name]
                                   for snapshot in snapshots]
                if not snapshotChoices:
                    snapshotChoices.insert(0, ('',
                                           _("No snapshot for this volume")))
                else:
                    snapshotChoices.insert(
                        0, ('',
                            _("Select snapshot to backup (Optional)")))
                self.fields['snapshot_id'].choices = snapshotChoices

            except Exception:
                redirect = reverse('horizon:project:volumes:index')
                exceptions.handle(request, _('Unable to fetch snapshots'),
                                  redirect=redirect)

    def handle(self, request, data):
        try:
            volume = api.cinder.volume_get(request, data['volume_id'])
            snapshot_id = data['snapshot_id'] or None
            force = False
            incremental = data.get('incremental', False)
            if volume.status == 'in-use':
                force = True
            backup = api.cinder.volume_backup_create(
                request, data['volume_id'],
                data['container_name'], data['name'],
                data['description'], force=force,
                incremental=incremental,
                snapshot_id=snapshot_id
            )

            message = _('Creating volume backup "%s"') % data['name']
            messages.info(request, message)
            return backup

        except Exception:
            redirect = reverse('horizon:project:volumes:index')
            exceptions.handle(request,
                              _('Unable to create volume backup.'),
                              redirect=redirect)


class RestoreBackupForm(forms.SelfHandlingForm):
    volume_id = forms.ThemableChoiceField(label=_('Select Volume'),
                                          required=False)
    backup_id = forms.CharField(widget=forms.HiddenInput())
    backup_name = forms.CharField(widget=forms.HiddenInput())
    redirect_url = 'horizon:project:backups:index'

    def __init__(self, request, *args, **kwargs):
        super().__init__(request, *args, **kwargs)

        try:
            search_opts = {'status': 'available'}
            volumes = api.cinder.volume_list(request, search_opts)
        except Exception:
            msg = _('Unable to lookup volume or backup information.')
            redirect = reverse(self.redirect_url)
            exceptions.handle(request, msg, redirect=redirect)
            raise exceptions.Http302(redirect)

        volumes.sort(key=operator.attrgetter('name', 'created_at'))
        choices = [('', _('Create a New Volume'))]
        choices.extend((volume.id, volume.name) for volume in volumes)
        self.fields['volume_id'].choices = choices

    def handle(self, request, data):
        backup_id = data['backup_id']
        backup_name = data['backup_name'] or None
        volume_id = data['volume_id'] or None

        try:
            restore = api.cinder.volume_backup_restore(request,
                                                       backup_id,
                                                       volume_id)

            # Needed for cases when a new volume is created.
            volume_id = restore.volume_id

            message = _('Request for restoring backup %(backup_name)s '
                        'to volume with id: %(volume_id)s '
                        'has been submitted.')
            messages.info(request, message % {'backup_name': backup_name,
                                              'volume_id': volume_id})
            return restore
        except Exception:
            msg = _('Unable to restore backup.')
            redirect = reverse(self.redirect_url)
            exceptions.handle(request, msg, redirect=redirect)
