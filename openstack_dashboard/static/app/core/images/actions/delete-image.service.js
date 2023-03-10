/**
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 * not use self file except in compliance with the License. You may obtain
 * a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */

(function() {
  'use strict';

  angular
    .module('horizon.app.core.images')
    .factory('horizon.app.core.images.actions.delete-image.service', deleteImageService);

  deleteImageService.$inject = [
    '$q',
    'horizon.app.core.openstack-service-api.glance',
    'horizon.app.core.openstack-service-api.policy',
    'horizon.framework.util.actions.action-result.service',
    'horizon.framework.util.i18n.gettext',
    'horizon.framework.util.q.extensions',
    'horizon.framework.widgets.modal.deleteModalService',
    'horizon.framework.widgets.toast.service',
    'horizon.app.core.images.resourceType'
  ];

  /*
   * @ngdoc factory
   * @name horizon.app.core.images.actions.delete-image.service
   *
   * @Description
   * Brings up the delete images confirmation modal dialog.

   * On submit, delete given images.
   * On cancel, do nothing.
   */
  function deleteImageService(
    $q,
    glance,
    policy,
    actionResultService,
    gettext,
    $qExtensions,
    deleteModal,
    toast,
    imagesResourceType
  ) {
    var notAllowedMessage = gettext("You are not allowed to delete images: %s");

    var service = {
      allowed: allowed,
      perform: perform
    };

    return service;

    //////////////

    function perform(items, newScope) {
      var scope = newScope;
      var context = { };
      var images = angular.isArray(items) ? items : [items];
      context.labels = labelize(images.length);
      context.deleteEntity = deleteImage;
      return $qExtensions.allSettled(images.map(checkPermission)).then(afterCheck);

      function checkPermission(image) {
        return {promise: allowed(image), context: image};
      }

      function afterCheck(result) {
        var outcome = $q.reject().catch(angular.noop);  // Reject the promise by default
        if (result.fail.length > 0) {
          toast.add('error', getMessage(notAllowedMessage, result.fail));
          outcome = $q.reject(result.fail).catch(angular.noop);
        }
        if (result.pass.length > 0) {
          outcome = deleteModal.open(scope, result.pass.map(getEntity), context).then(createResult);
        }
        return outcome;
      }
    }

    function allowed(image) {
      // only row actions pass in image
      // otherwise, assume it is a batch action
      if (image) {
        return $q.all([
          notProtected(image),
          policy.ifAllowed({ rules: [['image', 'delete_image']] }),
          notDeleted(image)
        ]);
      } else {
        return policy.ifAllowed({ rules: [['image', 'delete_image']] });
      }
    }

    function createResult(deleteModalResult) {
      // To make the result of this action generically useful, reformat the return
      // from the deleteModal into a standard form
      var actionResult = actionResultService.getActionResult();
      deleteModalResult.pass.forEach(function markDeleted(item) {
        actionResult.deleted(imagesResourceType, getEntity(item).id);
      });
      deleteModalResult.fail.forEach(function markFailed(item) {
        actionResult.failed(imagesResourceType, getEntity(item).id);
      });
      return actionResult.result;
    }

    function labelize(count) {
      return {

        title: ngettext(
          'Confirm Delete Image',
          'Confirm Delete Images', count),

        message: ngettext(
          'You have selected "%s". Deleted image is not recoverable.',
          'You have selected "%s". Deleted images are not recoverable.', count),

        submit: ngettext(
          'Delete Image',
          'Delete Images', count),

        success: ngettext(
          'Deleted Image: %s.',
          'Deleted Images: %s.', count),

        error: ngettext(
          'Unable to delete Image: %s.',
          'Unable to delete Images: %s.', count)
      };
    }

    function notDeleted(image) {
      return $qExtensions.booleanAsPromise(image.status !== 'deleted');
    }

    function notProtected(image) {
      return $qExtensions.booleanAsPromise(!image.protected);
    }

    function deleteImage(image) {
      return glance.deleteImage(image, true);
    }

    function getMessage(message, entities) {
      return interpolate(message, [entities.map(getName).join(", ")]);
    }

    function getName(result) {
      return getEntity(result).name;
    }

    function getEntity(result) {
      return result.context;
    }
  }
})();
