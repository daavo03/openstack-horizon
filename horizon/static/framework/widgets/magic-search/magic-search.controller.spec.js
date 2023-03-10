/*
 * (c) Copyright 2015 Hewlett-Packard Development Company, L.P.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function () {
  "use strict";

  describe('MagicSearchController', function () {
    var ctrl, scope, searchInput, $timeout, service, magicSearchEvents;

    function expectResetState() {
      expect(ctrl.facetSelected).toBeUndefined();
      expect(ctrl.facetOptions).toBeUndefined();
      expect(ctrl.filteredOptions).toBeUndefined();
      expect(ctrl.filteredObj).toBe(ctrl.unusedFacetChoices);
    }

    // Given an array of handlername:function items, return the
    // function for the given name.
    function getHandler(args, name) {
      return args.reduce(function (last, curr) {
        last[curr[0]] = curr[1];
        return last;
      }, {})[name];
    }

    beforeEach(module('horizon.framework.widgets.magic-search'));
    beforeEach(inject(function($controller, _$timeout_, $window, $rootScope, $injector) {
      $timeout = _$timeout_;
      scope = $rootScope.$new();
      scope.strings = { prompt: "Hello World!" };
      scope.facets_param = [];
      spyOn(scope, '$on').and.callThrough();
      service = $injector.get('horizon.framework.widgets.magic-search.service');
      magicSearchEvents = $injector.get('horizon.framework.widgets.magic-search.events');

      searchInput = {
        on: angular.noop, val: function() {
          return '';
        }, focus: angular.noop
      };
      spyOn(searchInput, 'on');

      var $element = { find: function() {
        return searchInput;
      }};

      ctrl = $controller('MagicSearchController', {
        $scope: scope, $element: $element, $timeout: $timeout,
        $window: $window
      });
    }));

    it("defines the controller", function() {
      expect(ctrl).toBeDefined();
    });

    describe("filterFacets", function() {
      var execFilter;

      beforeEach(function() {
        var keyUpHandler = getHandler(searchInput.on.calls.allArgs(), 'keyup');
        var evt = {
          keyCode: -1, charCode: 10, preventDefault: angular.noop
        };
        execFilter = function() {
          keyUpHandler(evt);
        };
        spyOn(searchInput, 'val').and.returnValue('hello');
        ctrl.facetSelected = {};
        ctrl.filteredObj = [];
      });

      it("sets the filteredObj if results to a text search", function() {
        delete ctrl.facetSelected;
        spyOn(service, 'getMatchingFacets').and.returnValue(['my', 'list']);
        execFilter();
        $timeout.flush();
        expect(ctrl.filteredObj).toEqual(['my', 'list']);
      });

      it("closes the menu if no results to a text search", function() {
        delete ctrl.facetSelected;
        ctrl.isMenuOpen = true;
        spyOn(service, 'getMatchingFacets').and.returnValue([]);
        execFilter();
        $timeout.flush();
        expect(ctrl.isMenuOpen).toBe(false);
      });

      it("sets filteredObj with results of an option search", function() {
        ctrl.facetOptions = [];
        ctrl.isMenuOpen = true;
        spyOn(service, 'getMatchingOptions').and.returnValue(['my', 'list']);
        execFilter();
        $timeout.flush();
        expect(ctrl.filteredObj).toEqual(['my', 'list']);
      });

      it("doesn't set filteredObj with no results of an option search", function() {
        ctrl.facetOptions = [];
        ctrl.isMenuOpen = true;
        spyOn(service, 'getMatchingOptions').and.returnValue([]);
        execFilter();
        expect(ctrl.filteredObj).toEqual([]);
      });

      it("doesn't set filteredObj with no facet options", function() {
        execFilter();
        expect(ctrl.filteredObj).toEqual([]);
      });
    });

    describe("clearSearch", function() {

      it("clears the currentSearch when currentSearch is not empty", function() {
        spyOn(scope, '$emit');
        ctrl.currentSearch = ['a', 'b', 'c'];
        scope.filter_keys = [1,2,3];
        ctrl.clearSearch();
        expect(scope.$emit).toHaveBeenCalledWith(magicSearchEvents.SEARCH_UPDATED, '');
        expect(scope.$emit).toHaveBeenCalledWith(magicSearchEvents.TEXT_SEARCH, '', [1,2,3]);
      });

    });

    describe("keydown handler", function() {
      var keyDownHandler;
      var evt = {keyCode: 10, charCode: 10, preventDefault: angular.noop};

      beforeEach(function() {
        keyDownHandler = getHandler(searchInput.on.calls.allArgs(), 'keydown');
      });

      it("is defined", function() {
        expect(keyDownHandler).toBeDefined();
      });

      it("does nothing with keys other than 9 and 8", function() {
        spyOn(evt, 'preventDefault');
        keyDownHandler(evt);
        expect(evt.preventDefault).not.toHaveBeenCalled();
      });

      it("does call preventDefault with keycode of 9", function() {
        evt.keyCode = 9;
        spyOn(evt, 'preventDefault');
        keyDownHandler(evt);
        expect(evt.preventDefault).toHaveBeenCalled();
      });

      describe("'Backspace' key", function() {
        beforeEach(function() {
          evt.keyCode = 8;
        });

        it("removes last facet if length larger than 1 and searchVal empty", function() {
          spyOn(searchInput, 'val').and.returnValue('');
          spyOn(ctrl, 'removeFacet');
          delete ctrl.facetSelected;
          ctrl.currentSearch = [{name: 'name=foo'}, {name: 'flavor=m1'}, {name: 'key=value'}];
          keyDownHandler(evt);
          $timeout.flush();
          expect(ctrl.removeFacet).toHaveBeenCalledWith(2);
        });

        it("removes selectedFacet if searchVal is empty", function() {
          spyOn(searchInput, 'val').and.returnValue('');
          ctrl.facetSelected = {name: 'waldo=undefined', label: ['a']};
          keyDownHandler(evt);
          $timeout.flush();
          expect(ctrl.facetSelect).toBeUndefined();
        });
      });
    });

    describe("keyup handler", function() {
      var keyUpHandler, evt;

      beforeEach(function() {
        keyUpHandler = getHandler(searchInput.on.calls.allArgs(), 'keyup');
        evt = {keyCode: 10, charCode: 10, preventDefault: angular.noop};
      });

      it("is defined", function() {
        expect(keyUpHandler).toBeDefined();
      });

      it("doesn't emit anything if sent a metakey", function() {
        evt.metaKey = true;
        spyOn(scope, '$emit');
        keyUpHandler(evt);
        expect(scope.$emit).not.toHaveBeenCalled();
      });

      describe("'Backspace' key", function() {

        beforeEach(function() {
          evt.keyCode = 8;
        });

        it("calls clearSearch if facetSelected undefined and currentSearch empty", function() {
          spyOn(searchInput, 'val').and.returnValue('');
          spyOn(ctrl, 'clearSearch');
          delete ctrl.facetSelected;
          ctrl.currentSearch = [];
          keyUpHandler(evt);
          expect(ctrl.clearSearch).toHaveBeenCalled();
        });

        it("emits textSearch if facetSeleted undefined and currentSearch not empty", function() {
          spyOn(searchInput, 'val').and.returnValue('');
          spyOn(scope, '$emit');
          delete ctrl.facetSelected;
          ctrl.currentSearch = [{name: 'textstuff'}, {name: 'texting'}];
          scope.filter_keys = [1,2,3];
          keyUpHandler(evt);
          expectResetState();
          expect(scope.$emit).toHaveBeenCalledWith(magicSearchEvents.TEXT_SEARCH, '', [1, 2, 3]);
        });

      });

      describe("'Escape' key", function() {
        beforeEach(function() {
          evt.keyCode = 27;
        });

        it("closes the menu", function() {
          ctrl.isMenuOpen = true;
          keyUpHandler(evt);
          $timeout.flush();
          expect(ctrl.isMenuOpen).toBe(false);
        });

        it("closes the menu (using charCode)", function() {
          ctrl.isMenuOpen = true;
          delete evt.keyCode;
          evt.charCode = 27;
          keyUpHandler(evt);
          $timeout.flush();
          expect(ctrl.isMenuOpen).toBe(false);
        });

        it("emits a textSearch event", function() {
          ctrl.textSearch = 'waldo';
          scope.filter_keys = 'abc';
          spyOn(scope, '$emit');
          keyUpHandler(evt);
          expect(scope.$emit).toHaveBeenCalledWith(magicSearchEvents.TEXT_SEARCH, 'waldo', 'abc');
        });

        it("emits a textSearch event even if ctrl.textSearch undefined", function() {
          delete ctrl.textSearch;
          scope.filter_keys = 'abc';
          spyOn(scope, '$emit');
          keyUpHandler(evt);
          expect(scope.$emit).toHaveBeenCalledWith(magicSearchEvents.TEXT_SEARCH, '', 'abc');
        });
      });

      describe("'Tab' key", function() {
        beforeEach(function() {
          evt.keyCode = 9;
          ctrl.facetSelected = {};
        });

        it("calls facetClicked when no facet selected and exactly one facet", function() {
          spyOn(ctrl, 'facetClicked');
          delete ctrl.facetSelected;
          ctrl.filteredObj = [{name: 'waldo'}];
          keyUpHandler(evt);
          expect(ctrl.facetClicked).toHaveBeenCalledWith(0, '', 'waldo');
        });

        it("doesn't call facetClicked when no facet selected and not one facet", function() {
          spyOn(ctrl, 'facetClicked');
          delete ctrl.facetSelected;
          ctrl.filteredObj = [{name: 'waldo'}, {name: 'warren'}];
          keyUpHandler(evt);
          expect(ctrl.facetClicked).not.toHaveBeenCalled();
        });

        it("calls optionClicked when a facet selected and one option", function() {
          spyOn(ctrl, 'optionClicked');
          ctrl.filteredOptions = [{key: 'thekey'}];
          keyUpHandler(evt);
          expect(ctrl.optionClicked).toHaveBeenCalledWith(0, '', 'thekey');
          expectResetState();
        });

        it("doesn't call optionClicked when a facet selected and not one option", function() {
          spyOn(ctrl, 'optionClicked');
          ctrl.filteredOptions = [{key: 'thekey'}, {key: 'another'}];
          keyUpHandler(evt);
          expect(ctrl.optionClicked).not.toHaveBeenCalled();
        });

        it("sets searchInput to an empty string", function() {
          spyOn(searchInput, 'val');
          delete ctrl.facetSelected;
          ctrl.filteredObj = [{name: 'waldo'}];
          keyUpHandler(evt);
          $timeout.flush();
          expect(searchInput.val).toHaveBeenCalledWith('');
        });

      });

      describe("'Enter' key", function() {
        beforeEach(function() {
          evt.keyCode = 13;
          ctrl.facetSelected = {name: 'waldo=undefined', label: ['a']};
        });

        it("hides menu if facet is selected", function() {
          ctrl.isMenuOpen = true;
          keyUpHandler(evt);
          $timeout.flush();
          expect(ctrl.isMenuOpen).toBe(false);
        });

        it("sets menu closed if facet is not selected", function() {
          ctrl.isMenuOpen = true;
          delete ctrl.facetSelected;
          keyUpHandler(evt);
          $timeout.flush();
          expect(ctrl.isMenuOpen).toBe(false);
        });

        it("removes currentSearch item names starting with 'text'", function() {
          delete ctrl.facetSelected;
          spyOn(searchInput, 'val').and.returnValue('searchval');
          scope.strings.text = 'stringtext';
          ctrl.currentSearch = [{name: 'textstuff'}, {name: 'texting'},
            {name: 'nontext'}, {name: 'nottext'}];
          keyUpHandler(evt);
          expect(ctrl.currentSearch).toEqual([{name: 'nontext'}, {name: 'nottext'},
            {name: 'text=searchval', label: ['stringtext', 'searchval']}]);
        });

        it("opens menu when searchVal is an empty string", function() {
          ctrl.isMenuOpen = false;
          spyOn(searchInput, 'val').and.returnValue('');
          spyOn(scope, '$emit');
          scope.filter_keys = [1,2,3];
          keyUpHandler(evt);
          $timeout.flush();
          expect(ctrl.isMenuOpen).toBe(true);
        });

        it("emits a Query  when not empty string and a facet is selected", function() {
          spyOn(searchInput, 'val').and.returnValue('foo');
          ctrl.currentSearch = [];
          keyUpHandler(evt);
          $timeout.flush();
          expect(ctrl.currentSearch).toEqual([{name: 'waldo=foo', label: ['a', 'foo']}]);
          expectResetState();
          expect(ctrl.isMenuOpen).toBe(true);
        });
      });

      describe("Any other key", function() {
        beforeEach(function() {
          evt.keyCode = -1;
        });

        it("performs a text search if the search is an empty string", function() {
          spyOn(searchInput, 'val').and.returnValue('');
          spyOn(scope, '$emit');
          scope.filter_keys = ['a', 'b', 'c'];
          keyUpHandler(evt);
          expect(scope.$emit).toHaveBeenCalledWith(
            magicSearchEvents.TEXT_SEARCH, '', ['a', 'b', 'c']);
        });

        it("filters if there is a search term", function() {
          spyOn(searchInput, 'val').and.returnValue('searchterm');
          spyOn(scope, '$emit');
          scope.filter_keys = [1,2,3];
          keyUpHandler(evt);
          expect(scope.$emit).toHaveBeenCalledWith(
            magicSearchEvents.TEXT_SEARCH, 'searchterm', [1,2,3]);
        });
      });
    });

    describe("keypress handler", function() {
      var keyPressHandler, evt;

      beforeEach(function() {
        keyPressHandler = getHandler(searchInput.on.calls.allArgs(), 'keypress');
        evt = {which: 65, keyCode: 10, charCode: 10, preventDefault: angular.noop};
      });

      it("is defined", function() {
        expect(keyPressHandler).toBeDefined();
      });

      it("searches for searchterm and 'e' if 'e' is typed", function() {
        evt.which = 69;
        spyOn(searchInput, 'val').and.returnValue('man');
        spyOn(scope, '$emit');
        scope.filter_keys = [1,2,3];
        keyPressHandler(evt);
        expect(scope.$emit).toHaveBeenCalledWith(
          magicSearchEvents.TEXT_SEARCH, 'mane', [1,2,3]);
      });

      it("opens menu when searchVal is a space", function() {
        evt.which = 32;
        keyPressHandler(evt);
        $timeout.flush();
        expect(ctrl.isMenuOpen).toBe(true);
      });

      it("filters when searchval has content and key is not delete/backspace", function() {
        spyOn(searchInput, 'val').and.returnValue('searchterm');
        spyOn(scope, '$emit');
        evt.which = 13; // not alter search
        scope.filter_keys = [1,2,3];
        keyPressHandler(evt);
        expect(scope.$emit).toHaveBeenCalledWith(
          magicSearchEvents.TEXT_SEARCH, 'searchterm', [1,2,3]);
      });

      it("does not filter when key is backspace/delete", function() {
        spyOn(searchInput, 'val').and.returnValue('searchterm');
        spyOn(scope, '$emit');
        evt.which = 8; // not alter search
        keyPressHandler(evt);
        expect(scope.$emit).not.toHaveBeenCalled();
      });

    });

    describe("optionClicked", function() {

      it("closes the menu", function() {
        ctrl.isMenuOpen = true;
        ctrl.facetSelected = {name: 'waldo', label: []};
        ctrl.filteredOptions = [{label: 'meow'}];
        ctrl.optionClicked(0);
        $timeout.flush();
        expect(ctrl.isMenuOpen).toBe(false);
      });

      it("resets state", function() {
        ctrl.facetSelected = {name: 'waldo', label: []};
        ctrl.filteredOptions = [{label: 'meow'}];
        ctrl.optionClicked(0);
        $timeout.flush();
        expectResetState();
      });

      it("adds to the current search", function() {
        ctrl.facetSelected = {name: 'waldo', label: ['a']};
        ctrl.filteredOptions = [{label: 'meow'}];
        ctrl.currentSearch = [];
        var nothing;
        ctrl.optionClicked(0, nothing, 'missing');
        expect(ctrl.currentSearch).toEqual([{name: 'waldo=missing', label: ['a', 'meow']}]);
      });

      it("adds to the current search, concatting labels", function() {
        ctrl.facetSelected = {name: 'waldo=undefined', label: ['a']};
        ctrl.filteredOptions = [{label: ['me', 'ow']}];
        ctrl.currentSearch = [];
        var nothing;
        ctrl.optionClicked(0, nothing, 'missing');
        expect(ctrl.currentSearch).toEqual([{name: 'waldo=missing', label: ['a', 'meow']}]);
      });
    });

    describe("removeFacet", function() {
      it("clears the currentSearch", function() {
        ctrl.currentSearch = [{}];
        ctrl.removeFacet(0);
        expect(ctrl.currentSearch).toEqual([]);
      });

      it("resets the main prompt if no more facets", function() {
        ctrl.currentSearch = [{}];
        scope.strings.prompt = 'aha';
        ctrl.mainPromptString = 'bon jovi';
        ctrl.removeFacet(0);
        $timeout.flush();
        expect(scope.strings.prompt).toEqual('bon jovi');
      });

      it("resets main prompt to blank if facets remain", function() {
        ctrl.currentSearch = [{}, {name: 'waldo'}];
        scope.strings.prompt = 'aha';
        ctrl.mainPromptString = 'bon jovi';
        ctrl.removeFacet(0);
        $timeout.flush();
        expect(scope.strings.prompt).toEqual('');
      });

      it("emits textSearch if text facet remains", function() {
        spyOn(scope, '$emit');
        ctrl.currentSearch = [{}];
        ctrl.textSearch = 'cat';
        ctrl.removeFacet(0);
        expect(scope.$emit).toHaveBeenCalledWith(magicSearchEvents.TEXT_SEARCH, 'cat', undefined);
      });

      it("resets state if facet selected", function() {
        ctrl.currentSearch = [{}];
        ctrl.facetSelected = {};
        ctrl.removeFacet(0);
        expectResetState();
      });
    });

    describe("facetClicked", function() {

      it("closes the menu", function() {
        ctrl.isMenuOpen = true;
        ctrl.filteredObj = [{name: 'a=b', label: 'ok'}];
        ctrl.facetClicked(0);
        $timeout.flush();
        expect(ctrl.isMenuOpen).toBe(false);
      });

      it("sets the prompt to an empty string", function() {
        scope.strings.prompt = 'aha';
        ctrl.filteredObj = [{name: 'a=b', label: 'ok'}];
        ctrl.facetClicked(0);
        $timeout.flush();
        expect(scope.strings.prompt).toBe('');
      });

      it("sets focus on the search input", function() {
        ctrl.filteredObj = [{name: 'a=b', label: 'ok'}];
        spyOn(searchInput, 'focus');
        ctrl.facetClicked(0);
        $timeout.flush();
        expect(searchInput.focus).toHaveBeenCalled();
      });

      it("sets facetSelected properly", function() {
        ctrl.filteredObj = [{name: 'name=waldo', label: 'ok'}];
        ctrl.facetClicked(0);
        $timeout.flush();
        expect(ctrl.facetSelected).toEqual({name: 'name=waldo', label: ['ok', '']});
      });

      it("sets facetSelected properly if the label is an array", function() {
        ctrl.filteredObj = [{name: 'name=waldo', label: ['o', 'k']}];
        ctrl.facetClicked(0);
        $timeout.flush();
        expect(ctrl.facetSelected).toEqual({name: 'name=waldo', label: ['ok', '']});
      });

      it("sets options if present in the filteredObj", function() {
        ctrl.filteredObj = [{name: 'name=waldo', label: 'ok', options: [1,2,3]}];
        ctrl.facetClicked(0);
        $timeout.flush();
        expect(ctrl.filteredOptions).toEqual([1,2,3]);
        expect(ctrl.facetOptions).toEqual([1,2,3]);
      });

      it("opens the menu if options present in the filteredObj", function() {
        ctrl.isMenuOpen = false;
        ctrl.filteredObj = [{name: 'name=waldo', label: 'ok', options: [1,2,3]}];
        ctrl.facetClicked(0);
        $timeout.flush();
        expect(ctrl.isMenuOpen).toBe(true);
      });
    });

    describe("initSearch event", function() {

      beforeEach(function() {
        spyOn(searchInput, 'val').and.callThrough();
      });

      it("registers a listener", function() {
        var initSearchHandler = getHandler(
          scope.$on.calls.allArgs(),
          magicSearchEvents.INIT_SEARCH);
        expect(initSearchHandler).toBeDefined();
      });

      it("initializes text search", function() {
        var data = {
          textSearch: "Snarf"
        };
        scope.$broadcast('initSearch', data);
        expect(ctrl.textSearch).toEqual("Snarf");
      });

      it("clears prior text search", function() {
        ctrl.textSearch = "Snarf";
        searchInput.val.calls.reset();
        var data = {
          textSearch: undefined
        };
        scope.$broadcast('initSearch', data);
        expect(ctrl.textSearch).toBeUndefined();
        expect(searchInput.val.calls.count()).toEqual(1);
        expect(searchInput.val.calls.argsFor(0)).toEqual(['']);
      });

      it("calls initSearch with the magicSearchQuery", function() {
        ctrl.facetChoices = "Old";
        var data = {
          magicSearchQuery: ["New"]
        };
        scope.$broadcast('initSearch', data);
        // facetChoices is initialized on initSearch. Look for that init
        // as proof the method was called
        expect(ctrl.facetChoices).toEqual([]);
      });
    });
    describe('Test float menu', function () {
      it('should float the menu at the top', function () {
        // There is no scroll executed so far
        ctrl.getScrollTop = function () {
          return 100;
        };

        var elementUsed = {
          width: angular.noop, css: angular.noop
        };
        spyOn(elementUsed, 'width');
        spyOn(elementUsed, 'css');

        ctrl.executeFloatMenu(elementUsed, 40, 140);

        expect(elementUsed.width).toHaveBeenCalledWith('53.9%');
        expect(elementUsed.css).toHaveBeenCalledWith( "z-index", 999);
        expect(elementUsed.css).toHaveBeenCalledWith('position', 'fixed');
        expect(elementUsed.css).toHaveBeenCalledWith('top', 140);

      });

      it('should fix the menu at the top', function () {
        // There is some scroll executed so far
        ctrl.getScrollTop = function () {
          return 0;
        };

        var elementUsed = {
          width: angular.noop, css: angular.noop
        };
        spyOn(elementUsed, 'width');
        spyOn(elementUsed, 'css');

        ctrl.executeFloatMenu(elementUsed, 40, 140);

        expect(elementUsed.width).toHaveBeenCalledWith('');
        expect(elementUsed.css).toHaveBeenCalledWith( "z-index", 999);
        expect(elementUsed.css).toHaveBeenCalledWith('position', 'relative');
        expect(elementUsed.css).toHaveBeenCalledWith('top', 0);
      });
    });
  });

  // NOTE: The javascript file being tested here isn't the magic-search code
  // as a whole, but instead the magic-overrides code.
  describe('MagicSearch module', function () {
    it('should be defined', function () {
      expect(angular.module('horizon.framework.widgets.magic-search')).toBeDefined();
    });
  });

/*
  xdescribe('magic-overrides directive', function () {
    var $window, $scope, $magicScope, $timeout;

    beforeEach(module('templates'));
    beforeEach(module('horizon.framework.widgets.magic-search'));

    beforeEach(module(function ($provide) {
      $provide.value('$window', {
        location: {
          search: ''
        }
      });
    }));

    beforeEach(inject(function ($injector) {
      $window = $injector.get('$window');
      var $compile = $injector.get('$compile');
      $scope = $injector.get('$rootScope').$new();
      $timeout = $injector.get('$timeout');

      $scope.filterStrings = {
        cancel: gettext('Cancel'),
        prompt: gettext('Prompt'),
        remove: gettext('Remove'),
        text: gettext('Text')
      };

      $scope.filterFacets = [
        {
          name: 'name',
          label: gettext('Name'),
          singleton: true
        },
        {
          name: 'status',
          label: gettext('Status'),
          options: [
            { key: 'active', label: gettext('Active') },
            { key: 'shutdown', label: gettext('Shutdown') },
            { key: 'error', label: gettext('Error') }
          ]
        },
        {
          name: 'flavor',
          label: gettext('Flavor'),
          singleton: true,
          options: [
            { key: 'm1.tiny', label: gettext('m1.tiny') },
            { key: 'm1.small', label: gettext('m1.small') }
          ]
        }
      ];

      // eslint-disable angular/ng_window_service //
      var markup =
        '<magic-search ' +
          'template="' + window.STATIC_URL + 'framework/widgets/magic-search/magic-search.html" ' +
          'strings="filterStrings" ' +
          'facets="{{ filterFacets }}">' +
        '</magic-search>';
      // eslint-enable angular/ng_window_service //

      $scope.$apply();

      $magicScope = $scope.$$childTail; //eslint-disable-line angular/ng_no_private_call

      spyOn($magicScope, '$emit');
      spyOn($magicScope, 'emitQuery');
      spyOn($magicScope, 'deleteFacetEntirely').and.callThrough();
      spyOn($magicScope, 'deleteFacetSelection').and.callThrough();
      spyOn($magicScope, 'initSearch');
      spyOn($magicScope, 'resetState');
    }));

    it('isMenuOpen should be initially false', function () {
      expect($magicScope.isMenuOpen).toBe(false);
    });

    it('isMenuOpen should be true after showMenu called', function () {
      $magicScope.showMenu();
      $timeout.flush();

      expect($magicScope.isMenuOpen).toBe(true);
    });

    it('isMenuOpen should be false after hideMenu called', function () {
      $magicScope.showMenu();
      $timeout.flush();
      $magicScope.hideMenu();
      $timeout.flush();

      expect($magicScope.isMenuOpen).toBe(false);
    });

    it('initSearch should be called when facetsChanged broadcasted', function () {
      $scope.$broadcast(magicSearchEvents.FACETS_CHANGED);
      $timeout.flush();

      expect($magicScope.currentSearch).toEqual([]);
      expect($magicScope.initSearch).toHaveBeenCalled();
    });

    it('currentSearch should be empty when URL has no search terms', function () {
      expect($magicScope.currentSearch).toEqual([]);
    });

    describe('initFacets', function () {
      it('currentSearch should have one item when URL has one search term', function () {
        $window.location.search = '?name=myname';
        $magicScope.initFacets();
        $timeout.flush();

        expect($magicScope.currentSearch.length).toBe(1);
        expect($magicScope.currentSearch[0].label).toEqual([ 'Name', 'myname' ]);
        expect($magicScope.currentSearch[0].name).toBe('name=myname');
        expect($magicScope.strings.prompt).toBe('');

        // 'name' facet should be deleted (singleton)
        expect($magicScope.deleteFacetEntirely).toHaveBeenCalledWith([ 'name', 'myname' ]);
      });

      it('currentSearch should have one item when given one search term', function () {
        var currentFacets = [{name: 'name=myname'}];
        $magicScope.initFacets(currentFacets);
        $timeout.flush();

        expect($magicScope.currentSearch.length).toBe(1);
        expect($magicScope.currentSearch[0].label).toEqual([ 'Name', 'myname' ]);
        expect($magicScope.currentSearch[0].name).toBe('name=myname');

        // 'name' facet should be deleted (singleton)
        expect($magicScope.deleteFacetEntirely).toHaveBeenCalledWith([ 'name', 'myname' ]);
      });

      it('currentSearch should have two items when given two search terms', function () {
        var currentFacets = [{name: 'name=myname'}, {name: 'status=active'}];
        $magicScope.initFacets(currentFacets);
        $timeout.flush();

        // only 'active' option should be removed from 'status' facet (not singleton)
        expect($magicScope.currentSearch.length).toBe(2);
        expect($magicScope.deleteFacetSelection).toHaveBeenCalledWith([ 'status', 'active' ]);
      });

      it('flavor facet should be removed if search term includes flavor', function () {
        var currentFacets = [{name: 'flavor=m1.tiny'}];
        $magicScope.initFacets(currentFacets);
        $timeout.flush();

        // entire 'flavor' facet should be removed even if some options left (singleton)
        expect($magicScope.deleteFacetEntirely).toHaveBeenCalledWith([ 'flavor', 'm1.tiny' ]);
      });

      it('currentSearch should have one item when search is textSearch', function () {
        $magicScope.textSearch = 'test';
        $magicScope.initFacets([]);
        $timeout.flush();

        expect($magicScope.currentSearch[0].label).toEqual([ 'Text', 'test' ]);
        expect($magicScope.currentSearch[0].name).toBe('text=test');
      });

      it('currentSearch should have textSearch and currentSearch', function () {
        $magicScope.textSearch = 'test';
        $magicScope.initFacets([{name: 'flavor=m1.tiny'}]);
        $timeout.flush();

        expect($magicScope.currentSearch.length).toBe(2);
        expect($magicScope.currentSearch[0].label).toEqual([ 'Flavor', 'm1.tiny' ]);
        expect($magicScope.currentSearch[0].name).toBe('flavor=m1.tiny');
        expect($magicScope.currentSearch[1].label).toEqual([ 'Text', 'test' ]);
        expect($magicScope.currentSearch[1].name).toBe('text=test');
      });

      it('should call checkFacets when initFacets called', function () {
        $magicScope.initFacets([]);

        expect($magicScope.$emit).toHaveBeenCalledWith(magicSearchEvents.CHECK_FACETS, []);
      });
    });

    describe('removeFacet', function () {
      beforeEach(function () {
        spyOn($magicScope, 'initFacets').and.callThrough();
      });

      it('should call emitQuery, initFacets and emit checkFacets on removeFacet', function () {
        var initialSearch = {
          name: 'name=myname',
          label: [ 'Name', 'myname' ]
        };
        $magicScope.currentSearch.push(initialSearch);
        $magicScope.removeFacet(0);

        expect($magicScope.currentSearch).toEqual([]);
        expect($magicScope.emitQuery).toHaveBeenCalledWith('name=myname');
        expect($magicScope.initFacets).toHaveBeenCalledWith([]);
        expect($magicScope.$emit).toHaveBeenCalledWith(magicSearchEvents.CHECK_FACETS, []);
        expect($magicScope.strings.prompt).toBe('Prompt');
      });

      it('prompt text === "" if search terms left after removal of one', function () {
        $magicScope.strings.prompt = '';

        $magicScope.currentSearch.push({ name: 'name=myname', label: [ 'Name', 'myname' ] });
        $magicScope.currentSearch.push({ name: 'status=active', label: [ 'Status', 'Active' ] });
        $magicScope.removeFacet(0);

        expect($magicScope.strings.prompt).toBe('');
      });

      it('should emit checkFacets on removeFacet if facetSelected', function () {
        var initialSearch = {
          name: 'name=myname',
          label: [ 'Name', 'myname' ]
        };
        $magicScope.currentSearch.push(initialSearch);
        $magicScope.facetSelected = {
          'name': 'status',
          'label': [ 'Status', 'active' ]
        };
        $magicScope.removeFacet(0);

        expect($magicScope.currentSearch).toEqual([]);
        expect($magicScope.resetState).toHaveBeenCalled();
        expect($magicScope.initFacets).toHaveBeenCalledWith([]);
        expect($magicScope.$emit).toHaveBeenCalledWith(magicSearchEvents.CHECK_FACETS, []);
      });

      it('should emit checkFacets and remember state on removeFacet if facetSelected', function () {
        var search1 = {
          name: 'name=myname',
          label: [ 'Name', 'myname' ]
        };
        var search2 = {
          name: 'flavor=m1.tiny',
          label: [ 'Flavor', 'm1.tiny' ]
        };
        $magicScope.currentSearch.push(search1);
        $magicScope.currentSearch.push(search2);
        $magicScope.facetSelected = {
          'name': 'status',
          'label': [ 'Status', 'active' ]
        };
        $magicScope.removeFacet(0);

        expect($magicScope.currentSearch).toEqual([search2]);
        expect($magicScope.resetState).toHaveBeenCalled();
        expect($magicScope.initFacets).toHaveBeenCalledWith([search2]);
        expect($magicScope.$emit).toHaveBeenCalledWith(magicSearchEvents.CHECK_FACETS, [search2]);
      });

    });
  });
*/
})();
