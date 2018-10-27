'use strict';
angular.module('auth', [])
    .controller('authController', function($scope, $http, $window){

        if(localStorage.getItem('access_token')) {
            $window.location.href = '/app';
        }
        
        $scope.auth = function() {
            $http({
                method: "POST",
                url: "https://api.eyeinc.ru/v0.9/index.php?c=eyeadminapi&m=auth",
                headers : {'Content-Type': 'application/x-www-form-urlencoded'}, 
                data: $.param({login: $scope.login, password: $scope.password, client_id:"web", client_secret:"EvZ5pWaVAhvC7laJdFNTNsrQLNaeF2"})
            }).then(function(result){
                if(result.data.success) {
                    localStorage.setItem('access_token', result.data.auth.access_token);
    			    localStorage.setItem('refresh_token', result.data.auth.refresh_token);
    			    localStorage.setItem('expires_in', result.data.auth.expires_in);
    			    localStorage.setItem('user_id', result.data.profile.id);
                    $window.location.href = '/app/';
                } else {
                    alert("Неверный логин/пароль");
                }
            })

        }

    })