/// <reference path="../7MinWorkout/workout.js" />
'use strict';

/* directives */
angular.module('app').directive('ngConfirm', [function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.bind('click', function () {
                var message = attrs.ngConfirmMessage || 'Are you sure?';
                if (message && confirm(message)) {
                    scope.$apply(attrs.ngConfirm);
                }
            });
        }
    }
}]);
// Angular validator pre Angular 1.3. Use this if you are on an earlier branch
//angular.module('app').directive('remoteValidator', ['$parse', function ($parse) {
//    return {
//        restrict: 'A',
//        priority: 5,
//        require: ['ngModel', '?^busyIndicator'],
//        link: function (scope, elm, attr, ctrls) {
//            var expfn = $parse(attr["remoteValidatorFunction"]);
//            var validatorName = attr["remoteValidator"];
//            var ngModelCtrl = ctrls[0];
//            var busyIndicator = ctrls[1];
//            ngModelCtrl.$parsers.push(function (value) {
//                var result = expfn(scope, { 'value': value });
//                if (result.then) {
//                    if (busyIndicator) busyIndicator.show();
//                    result.then(function (data) { //For promise type result object
//                        if (busyIndicator) busyIndicator.hide();
//                        ngModelCtrl.$setValidity(validatorName, data);
//                    }, function (error) {
//                        if (busyIndicator) busyIndicator.hide();
//                        ngModelCtrl.$setValidity(validatorName, true);
//                    });
//                }
//                return value;
//            });
//        }
//    }
//}]);

// Angular validator using Angular 1.3. Use this if you are on 1.3
angular.module('app').directive('remoteValidator', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        require: ['ngModel', '?^busyIndicator'],
        link: function (scope, elm, attr, ctrls) {
            var expfn = $parse(attr["remoteValidatorFunction"]);
            var validatorName = attr["remoteValidator"];
            var ngModelCtrl = ctrls[0];
            var busyIndicator = ctrls[1];

            ngModelCtrl.$asyncValidators[validatorName] = function (value) {
                return expfn(scope, { 'value': value });
            }
            if (busyIndicator) {
                scope.$watch(function () { return ngModelCtrl.$pending; }, function (newValue) {
                    if (newValue) busyIndicator.show();
                    else busyIndicator.hide();
                });
            }
        }
    }
}]);

// Angular 1.3 has already a built-in directive for supporting update on blur. Instead of using update-on-blur use ng-model-options="{ updateOn: 'blur' }" for Angular 1.3
angular.module('app').directive('updateOnBlur', function () {
    return {
        restrict: 'A',
        require: 'ngModel',
        priority: '100',
        link: function (scope, elm, attr, ngModelCtrl) {
            if (attr.type === 'radio' || attr.type === 'checkbox') return;
            elm.unbind('input').unbind('keydown').unbind('change');
            elm.bind('blur', function () {
                scope.$apply(function () {
                    ngModelCtrl.$setViewValue(elm.val());
                });
            });
        }
    };
});

angular.module('app').directive('busyIndicator', ['$compile', function ($compile) {
    return {
        scope: true,
        transclude: true,
        template: '<div><div ng-transclude=""></div><label ng-show="busy" class="text-info glyphicon glyphicon-refresh spin"></label></div>',
        //compile: function (element, attr) {
        //    // Injecting dynamic html at compile phase.
        //    // To use it comment transclude:true and template:<div>..  properties
        //    // No need to compile the DOM.
        //    // Just append it to element, and Angular will compile and later link it.
        //    var busyHtml = '<div><label ng-show="busy" class="text-info glyphicon glyphicon-refresh spin"></label></div>';
        //    element.append(busyHtml);
        //    return function (scope, element, attr) { }  //link function
        //},
        //link: function (scope, element, attr) {
        //    // Inject dynamic html at link phase.
        //    // To use it comment transclude:true and template:<div>..</div>  properties
        //    // Then inject the dependency $compile on the directive
        //    // Need to compile the DOM that before adding.
        //    // Just append it to element, and Angular will compile it.
        //    var linkfn = $compile('<div><label ng-show="busy" class="text-info glyphicon glyphicon-refresh spin"></label></div>');
        //    element.append(linkfn(scope));
        //},
        controller: ['$scope', function ($scope) {
            this.show = function () { $scope.busy = true; }
            this.hide = function () { $scope.busy = false; }
        }]

    }
}]);

angular.module('app').directive('ajaxButton', ['$compile', '$animate', function ($compile, $animate) {
    return {
        transclude: true,
        restrict: 'E',
        scope: {
            onClick: '&',
            submitting: '@'
        },
        replace: true,
        template: '<button ng-disabled="busy"><span class="glyphicon glyphicon-refresh spin" ng-show="busy"></span><span ng-transclude=""></span></button>',
        link: function (scope, element, attr) {
            if (attr.submitting !== undefined && attr.submitting != null) {
                attr.$observe("submitting", function (value) {
                    if (value) scope.busy = JSON.parse(value);
                });
            }
            if (attr.onClick) {
                element.on('click', function (event) {
                    scope.$apply(function () {
                        var result = scope.onClick();
                        if (attr.submitting !== undefined && attr.submitting != null) return;    //submitting attribute if there takes priority.
                        if (result.finally) {
                            scope.busy = true;
                            result.finally(function () { scope.busy = false });
                        }
                    });
                });
            }
        }
    }
}]);
angular.module('app').directive('owlCarousel', ['$compile', '$timeout', function ($compile, $timeout) {
    var owl = null;
    return {
        scope: {
            options: '=',
            source: '=',
            onUpdate:'&',
        },
        link: function (scope, element, attr) {
            var defaultOptions = {
                singleItem: true,
                pagination: false,
                afterAction: function () {
                    var itemIndex = this.currentItem;
                    scope.$evalAsync(function () {
                        scope.onUpdate({ currentItemIndex: itemIndex });
                    })
                },
            };
            if (scope.options) angular.extend(defaultOptions, scope.options);
            scope.$watch("source", function (newValue) {
                if (newValue) {
                    $timeout(function () {
                        owl = element.owlCarousel(defaultOptions);
                    }, 0);
                }
            });
        },
        controller: ['$scope', '$attrs', function ($scope, $attrs) {
            if ($attrs.owlCarousel) $scope.$parent[$attrs.owlCarousel] = this;
            this.next = function () {
                owl.trigger('owl.next');
            };
            this.previous = function () {
                owl.trigger('owl.prev');
            };
        }]
    };
}]);
