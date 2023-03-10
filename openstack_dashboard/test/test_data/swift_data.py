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

from urllib import parse

from oslo_utils import timeutils

from openstack_dashboard.api import swift
from openstack_dashboard.test.test_data import utils


def data(TEST):
    TEST.containers = utils.TestDataContainer()
    TEST.objects = utils.TestDataContainer()
    TEST.folder = utils.TestDataContainer()
    TEST.folder_alt = utils.TestDataContainer()
    TEST.subfolder = utils.TestDataContainer()

    # '%' can break URL if not properly url-quoted
    # ' ' (space) can break 'Content-Disposition' if not properly
    # double-quoted

    container_dict_1 = {"name": "container one%\u6346",
                        "container_object_count": 2,
                        "container_bytes_used": 256,
                        "timestamp": timeutils.utcnow().isoformat(),
                        "is_public": False,
                        "public_url": ""}
    container_1 = swift.Container(container_dict_1)
    container_2_name = "container_two\u6346"
    container_dict_2 = {"name": container_2_name,
                        "container_object_count": 4,
                        "container_bytes_used": 1024,
                        "timestamp": timeutils.utcnow().isoformat(),
                        "is_public": True,
                        "public_url":
                            "http://public.swift.example.com:8080/" +
                            "v1/project_id/%s" % parse.quote(container_2_name)}
    container_2 = swift.Container(container_dict_2)
    container_dict_3 = {"name": "container,three%\u6346",
                        "container_object_count": 2,
                        "container_bytes_used": 256,
                        "timestamp": timeutils.utcnow().isoformat(),
                        "is_public": False,
                        "public_url": ""}
    container_3 = swift.Container(container_dict_3)
    TEST.containers.add(container_1, container_2, container_3)

    object_dict = {"name": "test object%\u6346",
                   "content_type": "text/plain",
                   "bytes": 128,
                   "timestamp": timeutils.utcnow().isoformat(),
                   "last_modified": None,
                   "hash": "object_hash"}
    object_dict_2 = {"name": "test_object_two\u6346",
                     "content_type": "text/plain",
                     "bytes": 128,
                     "timestamp": timeutils.utcnow().isoformat(),
                     "last_modified": None,
                     "hash": "object_hash_2"}
    object_dict_3 = {"name": "test,object_three%\u6346",
                     "content_type": "text/plain",
                     "bytes": 128,
                     "timestamp": timeutils.utcnow().isoformat(),
                     "last_modified": None,
                     "hash": "object_hash"}
    object_dict_4 = {"name": "test folder%\u6346/test.txt",
                     "content_type": "text/plain",
                     "bytes": 128,
                     "timestamp": timeutils.utcnow().isoformat(),
                     "last_modified": None,
                     "hash": "object_hash"}
    obj_dicts = [object_dict, object_dict_2, object_dict_3, object_dict_4]
    obj_data = b"Fake Data"

    for obj_dict in obj_dicts:
        swift_object = swift.StorageObject(obj_dict,
                                           container_1.name,
                                           data=obj_data)
        TEST.objects.add(swift_object)

    folder_dict = {"subdir": "test folder%\u6346/"}

    TEST.folder.add(swift.PseudoFolder(folder_dict, container_1.name))

    # when the folder is returned as part of a prefix match, this content
    # is returned by Swift instead:
    folder_dict_alt = {
        "name": "test folder%\u6346/",
        "bytes": 0,
        "last_modified": timeutils.utcnow().isoformat(),
        "content_type": "application/octet-stream",
        "hash": "object_hash"
    }
    TEST.folder_alt.add(swift.PseudoFolder(folder_dict_alt, container_1.name))

    # just the objects matching the folder prefix
    TEST.subfolder.add(swift.PseudoFolder(folder_dict_alt, container_1.name))
    TEST.subfolder.add(swift.StorageObject(object_dict_4, container_1.name,
                                           data=object_dict_4))
