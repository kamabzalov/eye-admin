angular.module('app', ['ngRoute', 'datatables', 'datatables.buttons'])
   .factory('profileInterceptor', function(){
        return {
            request: function(config){
                if(localStorage.getItem("access_token")) {
                    config.headers['Authorization'] = "Bearer " + localStorage.getItem("access_token");
                }
                return config;
            }
        }
    })

    .config(function($httpProvider, $locationProvider, $routeProvider) {
        $httpProvider.interceptors.push('profileInterceptor');
        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
        });

        $routeProvider
        .when('/app/accounts/',{templateUrl: '/app/templates/accounts.html', controller: 'accountsController'})
        .when('/app/accounts/:id',{templateUrl: '/app/templates/account.html', controller: 'accountsController'})
        .when('/app/tickets/',{templateUrl: '/app/templates/tickets.html', controller: 'ticketsController'})
        .when('/app/tickets/:id',{templateUrl: '/app/templates/ticket.html', controller: 'ticketsController'})
        .when('/app/places/',{templateUrl: '/app/templates/places.html', controller: 'placesController'})
        .when('/app/places/:id',{templateUrl: '/app/templates/place.html', controller: 'placesController'})
        .when('/app/profile/',{templateUrl: '/app/templates/profile.html', controller: 'profileController'})
        .when('/app/stat/',{templateUrl: '/app/templates/stat.html', controller: 'statisticsController'})
        .when('/app/claims/',{templateUrl: '/app/templates/claims.html', controller: 'claimsController'})
        .otherwise({templateUrl: '/app/templates/main.html', controller: 'indexController'});
    })

    .controller("profileController", function($scope, $http, $window){

        $scope.refreshAccessToken = function (callback) {
            $http({
                url: "https://api.eyeinc.ru/v0.9/index.php?c=eyeadminapi&m=refreshaccesstoken",
                method: "POST",
                data: $.param({ "refresh_token": localStorage.getItem("refresh_token"), "client_id": "placeAdmin", "client_secret": "4BdWaqsx06iAIF8r6TVddScqZBLtqz" }),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }).then(function (result) {
                if (result.data.success) {
                    var auth = result.data.auth;
                    localStorage.setItem("access_token", auth.access_token);
                    localStorage.setItem("refresh_token", auth.refresh_token);
                    callback(true);
                }
                else {
                    callback(false);
                }
            }).catch(reject => {
                callback(false);
            });
        }
        
        $scope.getProfile = function() {
            $http({
                method: "GET",
                url: "https://api.eyeinc.ru/v0.9/index.php?c=eyeadminapi&m=profile"
            }).then(function(result){
                $scope.profileLogin = result.data.profile.name;
                $scope.profileAvatar = result.data.profile.avatar;
                $scope.profileFollowers = result.data.profile.followers;
                $scope.profileWatchers = result.data.profile.watchers;
                $scope.profileLikes = result.data.profile.likes;
            }).catch(function(response){
                if (response.status === 401) {
                    $scope.refreshAccessToken((success) => {
                        if (!success) {
                            $scope.logout();
                        } else {
                            $scope.getProfile();
                        }
                    });
                }
            })
        }

        $scope.logout = function() {
            localStorage.clear();
            $window.location.href = '/';
        }

        $scope.getProfile();

    })

    .controller("indexController", function($scope, $http){

        $scope.ANDROID_URL = "https://play.google.com/store/apps/details?id=eyeinc.eye";
        $scope.IOS_URL = "https://itunes.apple.com/ru/app/eye-%D1%82%D1%80%D0%B0%D0%BD%D1%81%D0%BB%D1%8F%D1%86%D0%B8%D0%B8-%D0%BF%D0%BE-%D0%B2%D1%81%D0%B5%D0%BC%D1%83-%D0%BC%D0%B8%D1%80%D1%83/id1179772257?mt=8";

        $scope.getReportsCount = function(){
            $http({
                method: "GET",
                url: "https://api.eyeinc.ru/v0.9/index.php?c=eyeadminapi&m=getReports",
            }).then(function(result){
                $scope.reportsCount = result.data.reports.length;
            })
        }

        $scope.getTicketsCount = function(){
            $http({
                method: "GET",
                url: "https://api.eyeinc.ru/v0.9/index.php?c=eyeadminapi&m=tickets",
            }).then(function(result){
                $scope.ticketsCount = result.data.tickets.length;
            })
        }

        $scope.getNotVerifiedBusinessAccounts = function(){
            $http({
                method: "GET",
                url: "https://api.eyeinc.ru/v0.9/index.php?c=eyeadminapi&m=getBusinessAccounts",
            }).then(function(result){ 
                $scope.notVerifyAccountsCount = result.data.business.filter(busin => busin.isVerify == 0).length;
            })
        }

        $scope.generateUrl = function(to){
            $http({
              url: "https://api.eyeinc.ru/v0.9/index.php?c=s&m=generateUrl",
              method: "GET",
              params: {describe: $scope.describe,from: $scope.from,to:to}
            }).then((result) => {
              $scope.siteUrl = result.data.url;         
            }).catch(function(response){
              console.log("ошибка" + response);
            })
        
          }

        $scope.getReportsCount();
        $scope.getTicketsCount();
        $scope.getNotVerifiedBusinessAccounts();
    })

    .controller("accountsController", function($scope,$http, $routeParams, $window, DTOptionsBuilder, DTColumnBuilder,DTColumnDefBuilder){

        var lang = {
            "sEmptyTable":     "Данные отсутствуют",
		    "sInfo":           "Показать с _START_ по _END_ из _TOTAL_ элементов",
		    "sInfoEmpty":      "Данные отсутствуют",
  		    "sInfoPostFix":    "",
  		    "sInfoThousands":  ",",
		    "sLengthMenu":     "Показывать _MENU_ элементов",
		    "sLoadingRecords": "Загрузка...",
		    "sProcessing":     "Загрузка...",
		    "sSearch":         "Поиск:",
		    "sZeroRecords":    "Данные отсутствуют",
		    "oPaginate": {
	            "sFirst":    "Начало",
	            "sLast":     "Конец",
	            "sNext":     "Вперед",
	            "sPrevious": "Назад"
		    },
		    "oAria": {
	            "sSortAscending":  ": по возрастанию",
	            "sSortDescending": ": по убыванию"
		    }
        }
        $scope.vm = {};
        $scope.vm.dtInstance = {};   
        $scope.vm.dtOptions = DTOptionsBuilder.newOptions()
                          .withOption('paging', true)
                          .withOption('searching', true)
                          .withOption('info', true)
                          .withLanguage(lang)
                          .withButtons([
                                            {
                                                extend:    'copy',
                                                text:      'Скопировать',
                                                titleAttr: 'Скопировать'
                                            },
                                            {
                                                extend:    'print',
                                                text:      'Печать',
                                                titleAttr: 'Печать'
                                            },
                                            {
                                                extend:    'excel',
                                                text:      'Импорт в Excel',
                                                titleAttr: 'Импорт в Excel'
                                            }
                                        ]);

        $scope.getAccountById = function(id) {
            $http({
                method: "GET",
                params: {id: id},
                url: "https://api.eyeinc.ru/v0.9/index.php?c=eyeadminapi&m=getAccountByUserId",
            }).then(function(result) {
                $scope.accountName = result.data.profile.name;
                $scope.accountEmail = result.data.profile.email;
                $scope.accountAvatar = result.data.profile.avatar;
            }).catch(function(result){
                console.log("Error" + result);
            })
        }            

        if($routeParams.id) {
            id = $routeParams.id;
            $scope.getAccountById(id);
        }

        $scope.getAccounts = function(){
            $http({
                method: "GET",
                url: "https://api.eyeinc.ru/v0.9/index.php?c=eyeadminapi&m=getUserAccounts",
            }).then(function(result){
                $scope.accounts = result.data.users;
            })
        }

        $scope.deleteAccount = function(id) {
            $http({
                method: "POST",
                data: $.param({id: id}),
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                url: "https://api.eyeinc.ru/v0.9/index.php?c=eyeadminapi&m=deleteProfile",
            }).then(function(result){
                if(result.data.success) {
                    $window.location.href = '/app';
                }
            })
        }

        $scope.updateAccount = function() {
            $http({
                method: "POST",
                data: $.param({id: id, name: $scope.accountName, email: $scope.accountEmail, avatar: $scope.avatar_base64}),
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                url: "https://api.eyeinc.ru/v0.9/index.php?c=eyeadminapi&m=updateUserAccount",
            }).then(function(result){
                $window.location.href = '/app/';
            })
        }

        $scope.changeAccountAvatar = function() {
            var reader = new FileReader();
            reader.readAsDataURL($scope.file);
            reader.onload = function () {
                angular.element(".avatar").attr("src", reader.result);
                $image = angular.element(".avatar");
                $image.cropper('destroy');
                $image.cropper({
                    aspectRatio: 4 / 3,
                    viewMode: 3,
                    cropBoxResizable:false,
                    dragMode: 'move',
                    toggleDragModeOnDblclick: false,
                    crop: function(event) {
                        str = cropper.getCroppedCanvas({width:640, height: 480}).toDataURL();
                        str = str.split(',')[1];
                        $scope.avatar_base64 = str;
                    }
                });
                var cropper = $image.data('cropper');
            };
        }


        $scope.getAccounts();

    })

    .controller("placesController", function($scope, $http, $routeParams, $window, DTOptionsBuilder, DTColumnBuilder,DTColumnDefBuilder){
        
        $scope.map = null;
        var geocoder = new google.maps.Geocoder;
        var markers = [];

        $scope.getBase64FromUrl = function (imgUrl) {
            var img = new Image();
            img.onload = function () {
            var canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            var dataURL = canvas.toDataURL("image/png");
            dataURL = dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
            $scope.currentAvatar64 = dataURL;
            }
            img.setAttribute('crossOrigin', 'anonymous');
            img.src = "https://api.eyeinc.ru/assets/avatars/" + imgUrl;
        }

        $scope.getPlaceById = function(id) {
            $http({
                method: "GET",
                params: {id: id},
                url: "https://api.eyeinc.ru/v0.9/index.php?c=eyeadminapi&m=getAccountByUserId",
            }).then(function(result){
                $scope.placeName = result.data.profile.name;
                $scope.placeEmail = result.data.profile.email;
                $scope.placeAddress = result.data.profile.address;
                $scope.placeLatitude = result.data.profile.latitude;
                $scope.placeLongitude = result.data.profile.longitude;
                $scope.placeAvatar  = result.data.profile.avatar;
                $scope.wallAvatar = result.data.wall.url;
                $scope.wallText = result.data.wall.information;
                $scope.placeCameras = result.data.cameras;
                $scope.isVerify = result.data.profile.isVerify == 1 ? true : false;

                $scope.getBase64FromUrl($scope.placeAvatar);
                    
                $scope.placeMarkerAndPanTo(new google.maps.LatLng($scope.placeLatitude, $scope.placeLongitude), map);
            })

        }

        $scope.initMap = function (callback) {
            try {
    
                var mapProp = {
                    center: new google.maps.LatLng(55.732093, 37.739179),
                    zoom: 11,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };
    
                map = new google.maps.Map(document.getElementById('gmap_markers'), mapProp);
    
                map.addListener('click', function (e) {
                    $scope.placeMarkerAndPanTo(e.latLng, map);
                });
    
                $scope.map = map;
                callback(map);
            }
            catch (e) {
                // TODO    
            }
        }

        if (!$scope.map) {
            $scope.initMap((map) =>{
            	if ($scope.placeLatitude && $scope.placeLongitude){
            		$scope.map = map;
            		$scope.placeMarkerAndPanTo(new google.maps.LatLng($scope.placeLatitude, $scope.placeLongitude), map);
            	}
            		var input = document.getElementById("address");
        			var autocomplete = new google.maps.places.Autocomplete(input);

        			google.maps.event.addListener(autocomplete, 'place_changed', function () {
    					var place = autocomplete.getPlace();
    					var scope = angular.element("#address").scope();
    					scope.$apply(function(){
    						scope.placeAddress = place.formatted_address;
    						scope.placeLatitude = place.geometry.location.lat();
    						scope.placeLongitude = place.geometry.location.lng();
    						scope.placeMarkerAndPanTo({"lat" : scope.placeLatitude,"lng" : scope.placeLongitude}, scope.map);
    					})
					});

            });
        }

        $scope.placeMarkerAndPanTo = function (latLng, map) {
            $scope.deleteMarkers();
            var marker = new google.maps.Marker({
                position: latLng,
                map: map,
            });
            markers.push(marker);
            map.panTo(latLng);
            $scope.addressTransform(latLng);
        }

        $scope.setAddress = function (address, latlng) {
            try {
                $scope.placeAddress = address;
                $scope.placeLatitude = latlng.lat();
                $scope.placeLongitude = latlng.lng();
            }
            catch (e) {
            }
        }

        $scope.addressTransform = function (latlng) {
            geocoder.geocode({ 'location': latlng }, function (results, status) {
                if (status === 'OK') {
                    address = "";
                    if (results[0]) {
                        address = results[0].formatted_address;
                        $scope.$apply(function () {
                            $scope.setAddress(address, latlng);
                        })
    
                    } else {
                        window.alert('No results found');
                    }
                } else {
                    window.alert('Geocoder failed due to: ' + status);
                }
            });
        }
    
        $scope.codeAddress = function () {
            var geocoder = new google.maps.Geocoder;
            geocoder.geocode({ "address": $scope.placeAddress }, (results, status) => {
                $scope.placeLatitude = results[0].geometry.location.lat();
                $scope.placeLongitude = results[0].geometry.location.lng();
                $scope.placeMarkerAndPanTo({ lat: $scope.placeLatitude, lng: $scope.placeLongitude }, $scope.map);
            });
        }

        $scope.deleteMarkers = function () {
            for (var i = 0; i < markers.length; i++) {
                markers[i].setMap(null);
            }
            markers = [];
        }
    
        $scope.makeAutoComplete = function () {
            var input = document.getElementById("#address");
            var autocomplete = new google.maps.places.Autocomplete(input);
        }

        if($routeParams.id) {
            id = $routeParams.id;
            $scope.getPlaceById(id);
        }

        $scope.changeAccountAvatar = function() {
            var reader = new FileReader();
            reader.readAsDataURL($scope.file);
            reader.onload = function () {
                angular.element(".avatar").attr("src", reader.result);
                $image = angular.element("#placeAvatar");
                $image.cropper('destroy');
                $image.cropper({
                    aspectRatio: 4 / 3,
                    viewMode: 3,
                    cropBoxResizable:false,
                    dragMode: 'move',
                    toggleDragModeOnDblclick: false,
                    crop: function(event) {
                        str = cropper.getCroppedCanvas({width:640, height: 480}).toDataURL();
                        str = str.split(',')[1];
                        $scope.newPlaceAvatar = str;
                    }
                });
                var cropper = $image.data('cropper');
            };
        }

        $scope.changeWallImage = function() {
            var reader = new FileReader();
            reader.readAsDataURL($scope.file);
            reader.onload = function () {
                angular.element(".avatar").attr("src", reader.result);
                $image = angular.element("#wallAvatar");
                $image.cropper('destroy');
                $image.cropper({
                    aspectRatio: 4 / 3,
                    viewMode: 3,
                    cropBoxResizable:false,
                    dragMode: 'move',
                    toggleDragModeOnDblclick: false,
                    crop: function(event) {
                        str = cropper.getCroppedCanvas({width:640, height: 480}).toDataURL();
                        str = str.split(',')[1];
                        $scope.newWallAvatar = str;
                    }
                });
                var cropper = $image.data('cropper');
            };
        }
        
        var lang = {
            "sEmptyTable":     "Данные отсутствуют",
		    "sInfo":           "Показать с _START_ по _END_ из _TOTAL_ элементов",
		    "sInfoEmpty":      "Данные отсутствуют",
  		    "sInfoPostFix":    "",
  		    "sInfoThousands":  ",",
		    "sLengthMenu":     "Показывать _MENU_ элементов",
		    "sLoadingRecords": "Загрузка...",
		    "sProcessing":     "Загрузка...",
		    "sSearch":         "Поиск:",
		    "sZeroRecords":    "Данные отсутствуют",
		    "oPaginate": {
	            "sFirst":    "Начало",
	            "sLast":     "Конец",
	            "sNext":     "Вперед",
	            "sPrevious": "Назад"
		    },
		    "oAria": {
	            "sSortAscending":  ": по возрастанию",
	            "sSortDescending": ": по убыванию"
		    }
        }
        $scope.vm = {};
        $scope.vm.dtInstance = {};   
        $scope.vm.dtOptions = DTOptionsBuilder.newOptions()
                          .withOption('paging', true)
                          .withOption('searching', true)
                          .withOption('info', true)
                          .withLanguage(lang)
                          .withButtons([
                                            {
                                                extend:    'copy',
                                                text:      'Скопировать',
                                                titleAttr: 'Скопировать'
                                            },
                                            {
                                                extend:    'print',
                                                text:      'Печать',
                                                titleAttr: 'Печать'
                                            },
                                            {
                                                extend:    'excel',
                                                text:      'Импорт в Excel',
                                                titleAttr: 'Импорт в Excel'
                                            }
                                        ]);
        
        $scope.getPlaces = function() {
                $http({
                    method: "GET",
                    url: "https://api.eyeinc.ru/v0.9/index.php?c=eyeadminapi&m=getBusinessAccounts",
                }).then(function(result){
                    $scope.places = result.data.business;
                })
        } 
        $scope.getPlaces();   


        $scope.updatePlace = function() {


            $scope.profile = JSON.stringify({
                id: id,
                name: $scope.placeName,
                avatar: $scope.newPlaceAvatar != null ? $scope.newPlaceAvatar : $scope.currentAvatar64 ,
                isVerify: $scope.isVerify ? 1 : 0,
                address: $scope.placeAddress,
                latitude: $scope.placeLatitude,
                longitude: $scope.placeLongitude
            });

            $scope.wall = JSON.stringify({
                describe: $scope.wallText,
                image: $scope.newWallAvatar
            });

            $scope.cameras = JSON.stringify($scope.placeCameras)
            

            $http({
                method: "POST",
                data: $.param({profile: $scope.profile, wall: $scope.wall, cameras: $scope.cameras}),
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                url: "https://api.eyeinc.ru/v0.9/index.php?c=eyeadminapi&m=updateBusinessProfile",
            }).then(function(result){
                $window.location.href = '/app/';
            })
        }
    
    })

    .controller("ticketsController", function($scope, $http, $routeParams, DTOptionsBuilder, DTColumnBuilder,DTColumnDefBuilder){

        var lang = {
            "sEmptyTable":     "Данные отсутствуют",
		    "sInfo":           "Показать с _START_ по _END_ из _TOTAL_ элементов",
		    "sInfoEmpty":      "Данные отсутствуют",
  		    "sInfoPostFix":    "",
  		    "sInfoThousands":  ",",
		    "sLengthMenu":     "Показывать _MENU_ элементов",
		    "sLoadingRecords": "Загрузка...",
		    "sProcessing":     "Загрузка...",
		    "sSearch":         "Поиск:",
		    "sZeroRecords":    "Данные отсутствуют",
		    "oPaginate": {
	            "sFirst":    "Начало",
	            "sLast":     "Конец",
	            "sNext":     "Вперед",
	            "sPrevious": "Назад"
		    },
		    "oAria": {
	            "sSortAscending":  ": по возрастанию",
	            "sSortDescending": ": по убыванию"
		    }
        }
        $scope.vm = {};
        $scope.vm.dtInstance = {};   
        $scope.vm.dtOptions = DTOptionsBuilder.newOptions()
                          .withOption('paging', true)
                          .withOption('searching', true)
                          .withOption('info', true)
                          .withLanguage(lang)
                          .withButtons([
                                            {
                                                extend:    'copy',
                                                text:      'Скопировать',
                                                titleAttr: 'Скопировать'
                                            },
                                            {
                                                extend:    'print',
                                                text:      'Печать',
                                                titleAttr: 'Печать'
                                            },
                                            {
                                                extend:    'excel',
                                                text:      'Импорт в Excel',
                                                titleAttr: 'Импорт в Excel'
                                            }
                                        ]);

        $scope.getTickets = function(){
            $http({
                method: "GET",
                url: "https://api.eyeinc.ru/v0.9/index.php?c=eyeadminapi&m=tickets",
            }).then(function(result){
                $scope.tickets = result.data.tickets;
            })
        }

        $scope.getTickets();

        $scope.getTicketById = function(id) {
            $http({
                method: "GET",
                params: {id: id},
                url: "https://api.eyeinc.ru/v0.9/index.php?c=eyeadminapi&m=ticket",
            }).then(function(result) {
                $scope.ticketAccount = result.data.ticket.name;
                $scope.ticketTheme = result.data.ticket.reason;
                $scope.ticketEmailFrom = result.data.ticket.email_from;
                $scope.ticketText = result.data.ticket.text;
            })
        }  
        
        if($routeParams.id) {
            id = $routeParams.id;
            $scope.getTicketById(id);
        }

        $scope.answerToTicket = function() {
            $http({
                method: "POST",
                data: $.param({ticketId: id, response: $scope.ticketAnswer}),
                url: "https://api.eyeinc.ru/v0.9/index.php?c=eyeadminapi&m=sendMessage",
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' }
            }).then(result => {
                console.log(result);
            })
        }


    })

    .controller("claimsController", function($scope, $http, DTOptionsBuilder, DTColumnBuilder,DTColumnDefBuilder){
        var lang = {
            "sEmptyTable":     "Данные отсутствуют",
		    "sInfo":           "Показать с _START_ по _END_ из _TOTAL_ элементов",
		    "sInfoEmpty":      "Данные отсутствуют",
  		    "sInfoPostFix":    "",
  		    "sInfoThousands":  ",",
		    "sLengthMenu":     "Показывать _MENU_ элементов",
		    "sLoadingRecords": "Загрузка...",
		    "sProcessing":     "Загрузка...",
		    "sSearch":         "Поиск:",
		    "sZeroRecords":    "Данные отсутствуют",
		    "oPaginate": {
	            "sFirst":    "Начало",
	            "sLast":     "Конец",
	            "sNext":     "Вперед",
	            "sPrevious": "Назад"
		    },
		    "oAria": {
	            "sSortAscending":  ": по возрастанию",
	            "sSortDescending": ": по убыванию"
		    }
        }
        $scope.vm = {};
        $scope.vm.dtInstance = {};   
        $scope.vm.dtOptions = DTOptionsBuilder.newOptions()
                          .withOption('paging', true)
                          .withOption('searching', true)
                          .withOption('info', true)
                          .withLanguage(lang)
                          .withButtons([
                                            {
                                                extend:    'copy',
                                                text:      'Скопировать',
                                                titleAttr: 'Скопировать'
                                            },
                                            {
                                                extend:    'print',
                                                text:      'Печать',
                                                titleAttr: 'Печать'
                                            },
                                            {
                                                extend:    'excel',
                                                text:      'Импорт в Excel',
                                                titleAttr: 'Импорт в Excel'
                                            }
                                        ]);
        $scope.getReports = function(){
            $http({
                method: "GET",
                url: "https://api.eyeinc.ru/v0.9/index.php?c=eyeadminapi&m=getReports",
            }).then(function(result){
                if(!result.data.reports) {
                    return;
                }
            })
        } 
        
        $scope.getReports();
    })

    .controller("businessAccountsController", function($scope, $http){
        
        $scope.getBusinessAccounts = function(){
            $http({
                method: "GET",
                url: "https://api.eyeinc.ru/v0.9/index.php?c=eyeadminapi&m=getBusinessAccounts",
            }).then(function(result){
                $scope.businessAccounts = result.data.business;
            })
        }

        $scope.getBusinessAccounts();

    })

    .controller("statisticsController", function($scope, $http, DTOptionsBuilder, DTColumnBuilder,DTColumnDefBuilder) {
        $scope.activity = {
            now : {
              count : 0,
              percent : 0
            },
            week : {
              count : 0,
              percent : 0
            },    
            month : {
              count : 0,
              percent : 0
            },
            count : 0
        };

        $scope.inputActivity = {
            start : "",
            end : "",
            users : [],
            count: 0
        };
        
        $scope.getNewPersonStatistic = function() {
            $http({
                method: "GET",
                url: "https://api.eyeinc.ru/v0.9/index.php?c=s&m=statisticsRegisterNewAccounts",
            }).then(function(result){
                $scope.newPersons = result.data.persons
                $scope.newPersonsCount = result.data.count
                $scope.newdatas = result.data.datas
            })
        }

        $scope.getActivityPersonStatistic = function(){
              $http({
                url: "https://api.eyeinc.ru/v0.9/index.php?c=s&m=getActivityPersons",
                method: "GET"
              }).then((result) => {
                $scope.activity.now = result.data.now;      
                $scope.activity.week = result.data.week;           
                $scope.activity.month = result.data.month;           
                $scope.activity.count = result.data.count;           
              }).catch(function(response){
                console.log("ошибка" + response);
              })
        }

        $scope.getActivityPosts = function(){
            $http({
                url: "https://api.eyeinc.ru/v0.9/index.php?c=s&m=getActivityPosts",
                method: "GET"
            }).then((result) => {
                $scope.activityPosts = result.data.activityPosts;         
            }).catch(function(response){
                console.log("ошибка" + response);
            })
        }

        $scope.getInputActivity = function(notChangeWindow){
            if (!notChangeWindow){
              $scope.isInputActivityWindow = !$scope.isInputActivityWindow;
            }
            if ($scope.isInputActivityWindow){
              $http({
                url: "https://api.eyeinc.ru/v0.9/index.php?c=s&m=getInputActivity",
                method: "GET",
                params: {start: $scope.inputActivity.start, end: $scope.inputActivity.end}
              }).then((result) => {
                $scope.inputActivity.count = result.data.count;
                $scope.inputActivity.users = result.data.users;         
              }).catch(function(response){
                console.log("ошибка" + response);
              })
            }
        }
        
        $scope.getNewPersonStatistic();
        $scope.getActivityPersonStatistic();
        $scope.getActivityPosts();
        $scope.getInputActivity();

        var lang = {
            "sEmptyTable":     "Данные отсутствуют",
		    "sInfo":           "Показать с _START_ по _END_ из _TOTAL_ элементов",
		    "sInfoEmpty":      "Данные отсутствуют",
  		    "sInfoPostFix":    "",
  		    "sInfoThousands":  ",",
		    "sLengthMenu":     "Показывать _MENU_ элементов",
		    "sLoadingRecords": "Загрузка...",
		    "sProcessing":     "Загрузка...",
		    "sSearch":         "Поиск:",
		    "sZeroRecords":    "Данные отсутствуют",
		    "oPaginate": {
	            "sFirst":    "Начало",
	            "sLast":     "Конец",
	            "sNext":     "Вперед",
	            "sPrevious": "Назад"
		    },
		    "oAria": {
	            "sSortAscending":  ": по возрастанию",
	            "sSortDescending": ": по убыванию"
		    }
        }
        $scope.vm = {};
        $scope.vm.dtInstance = {};   
        $scope.vm.dtOptions = DTOptionsBuilder.newOptions()
                          .withOption('paging', true)
                          .withOption('searching', true)
                          .withOption('info', true)
                          .withLanguage(lang)
                          .withButtons([
                                            {
                                                extend:    'copy',
                                                text:      'Скопировать',
                                                titleAttr: 'Скопировать'
                                            },
                                            {
                                                extend:    'print',
                                                text:      'Печать',
                                                titleAttr: 'Печать'
                                            },
                                            {
                                                extend:    'excel',
                                                text:      'Импорт в Excel',
                                                titleAttr: 'Импорт в Excel'
                                            }
                                        ]);
    })

.directive("ngFileSelect",function(){

    return {
        restrict: "A",
        link: function(scope,el){
            el.bind("change", function(e){
                scope.file = (e.srcElement || e.target).files[0];
                scope.changeAccountAvatar();
            })
        }, 
    }
})

.directive("ngWallImage",function(){

    return {
        restrict: "A",
        link: function(scope,el){
            el.bind("change", function(e){
                scope.file = (e.srcElement || e.target).files[0];
                scope.changeWallImage();
            })
        }, 
    }
})