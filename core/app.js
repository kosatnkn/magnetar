
// __________________________________________________________________________________________________________ App Module


const App = (function()
{
    function run()
    {
        // check local storage for a session
        if(!App.Session.isValid())
        {
            reset();
            return;
        }

        // when session valid, set app status using given url
        App.Router.init();
    }


    function reset()
    {
        App.Session.destroy();
        App.Router.reset();
        App.Components.MainNav.hide();
        App.Components.SideNav.hide();
        App.Modules.Login.show();
    }


    return {
        run: run,
        reset: reset
    };

})();


// ____________________________________________________________________________________________________________ Settings


App.Settings = (function()
{
    // app name
    const AppName = "magnetar-client";

    // session timeout in hours
    const SessionTimeout = 24;

    const ApiUrl = 'http://localhost:8080/dwarfstar/public/v1/';

    // all api endpoints
    const ApiEndpoints = {
        AUTH: ApiUrl + 'auth/login',
        PERMISSION: ApiUrl + 'auth/permission',

        ACTION_GET_LIST: ApiUrl + 'action',
        ACTION_GET_BY_ID: ApiUrl + 'action/{id}',
        ACTION_ADD: ApiUrl + 'action',
        ACTION_EDIT: ApiUrl + 'action/{id}'
    };

    // all possible user actions for the entire app
    const UserAction = {
        ADD: 'add',
        EDIT: 'edit',
        CHANGE_STATUS: 'change_status',
        CANCEL: 'cancel',
        DELETE: 'delete'
    };

    // all possible filter operators
    const FilterOperator = {
        EQUAL: 1
    };


    return {
        AppName: AppName,
        SessionTimeout: SessionTimeout,
        ApiUrl: ApiUrl,
        UserAction: UserAction,
        FilterOperator: FilterOperator,
        ApiEndpoints: ApiEndpoints
    };

})();


// ______________________________________________________________________________________________________ Session Object


App.Session = (function()
{
    function init(objData)
    {
        var objSession = {
            timestamp: $.now(),
            token: objData.token,
            user: jwt_decode(objData.token).data.user,
            routs: objData.permissions,
            permitted: _setPermittedRouts(objData.permissions.routs)
        };

        localStorage.setItem(App.Settings.AppName, JSON.stringify(objSession));
    }


    function _setPermittedRouts(objPermissions)
    {
        var objPermittedRoutes = {};

        $.each(objPermissions, function(intGroupIndex, objGroup)
        {
            $.each(objGroup.modules, function(intItemIndex, objItem)
            {
                objPermittedRoutes[objItem.route] = objItem.action;
            });
        });

        return objPermittedRoutes;
    }


    function isValid()
    {
        var objSession = localStorage.getItem(App.Settings.AppName);

        if(objSession === null)
        {
            return false;
        }

        // timestamp given in milliseconds (3600000 = 1 hour)
        if((JSON.parse(objSession).timestamp + (3600000 * parseInt(App.Settings.SessionTimeout))) <= $.now())
        {
            destroy();
            return false;
        }

        return true;
    }


    function getToken()
    {
        return JSON.parse(localStorage.getItem(App.Settings.AppName)).token;
    }


    function getUser()
    {
        return JSON.parse(localStorage.getItem(App.Settings.AppName)).user;
    }


    function getRouts()
    {
        return JSON.parse(localStorage.getItem(App.Settings.AppName)).routs;
    }


    function getPermittedRouts()
    {
        return JSON.parse(localStorage.getItem(App.Settings.AppName)).permitted;
    }


    function getDefaultRoute()
    {
        return '#' + getRouts().default;
    }


    function destroy()
    {
        localStorage.removeItem(App.Settings.AppName);
    }


    return {
        init: function(objData){ init(objData); },
        isValid: isValid,
        getToken: getToken,
        getUser: getUser,
        getRouts: getRouts,
        getPermittedRouts: getPermittedRouts,
        getDefaultRoute: getDefaultRoute,
        destroy: destroy
    };

})();


// _______________________________________________________________________________________________________ Events PubSub


App.Events = (function()
{
    var events = {};


    function on(eventName, fn)
    {
        events[eventName] = events[eventName] || [];
        events[eventName].push(fn);
    }


    function off(eventName, fn)
    {
        if(events[eventName])
        {
            for(var i = 0; i < events[eventName].length; i++)
            {
                events[eventName].splice(i, 1);

                // // NOTE: This is the original logic. It will check whether functions are identical.
                // if(events[eventName][i] === fn)
                // {
                //     events[eventName].splice(i, 1);
                //     break;
                // }
            }
        }
    }


    function emit(eventName, data)
    {
        if(events[eventName])
        {
            events[eventName].forEach(function (fn)
            {
                fn(data);
            });
        }
    }


    // provide public methods
    return {
        on: function(eventName, fn) { on(eventName, fn); },
        off: function(eventName, fn) { off(eventName, fn); },
        emit: function(eventName, data) { emit(eventName, data); },
        events: events
    };

})();


// ______________________________________________________________________________________________________ Request Object


App.Request = (function()
{
    // response codes
    const ResponseCode = {
        OK: 200,
        CREATED: 201,
        NO_CONTENT: 204,
        UNPROCESSABLE: 422,
        SERVER_ERROR: 500
    };

    const SuccessResponses = [
        ResponseCode.OK,
        ResponseCode.CREATED,
        ResponseCode.NO_CONTENT
    ];

    const ErrorResponses = [
        ResponseCode.UNPROCESSABLE,
        ResponseCode.SERVER_ERROR
    ];

    // response queue
    var ResponseQueue = {};

    // unauthenticated routs
    const _arrUnauthenticatedRouts = [
        App.Settings.ApiEndpoints.AUTH,
        App.Settings.ApiEndpoints.PERMISSION
    ];

    var _arrLatestRequest = [];

    // request header
    var _objRequestHeader = {
        "Accept":"application/json"
    };


    function _request(strKey, strMethod, strEndpoint, objData)
    {
        // check whether session is valid
        if(!App.Session.isValid()
            && $.inArray(strEndpoint, _arrUnauthenticatedRouts) === -1
        )
        {
            App.Modules.Login.logout();

            return;
        }

        const intTimestamp = $.now();

        // update latest request array
        _arrLatestRequest[strKey] = {
            timestamp: intTimestamp
        };

        // replace placeholders of endpoint string with data values
        $.each(objData, function(strPlaceholder, strValue)
        {
            if(strEndpoint.indexOf('{' + strPlaceholder + '}') != -1)
            {
                strEndpoint = strEndpoint.replace('{' + strPlaceholder + '}', strValue);

                // remove matched key value pair from data object
                delete objData[strPlaceholder];
            }
        });

        // add token to request data
        if($.inArray(strEndpoint, _arrUnauthenticatedRouts) === -1)
        {
            _objRequestHeader.Authorization = 'Bearer ' + App.Session.getToken();
        }

        $.ajax({
            type: strMethod,
            url: strEndpoint,
            headers: _objRequestHeader,
            data: objData,
            success: function(objResult, strStatus, objXHR)
            {
                _updateResponseQueue(strKey, objXHR.status, intTimestamp, objResult);
            },
            error: function(objXHR, strStatus)
            {
                _updateResponseQueue(strKey, objXHR.status , intTimestamp, objXHR.responseJSON);
            }
        });
    }


    function _updateResponseQueue(strKey, intResponseCode, intTimestamp, objValue)
    {
        // check whether the response is of latest request
        if(_arrLatestRequest[strKey].timestamp > intTimestamp)
        {
            return;
        }

        // find response by key in array
        if(typeof ResponseQueue[strKey] != 'undefined')
        {
            // if existing response older than new response replace with new response
            if(ResponseQueue[strKey].timestamp < intTimestamp)
            {
                ResponseQueue[strKey] = {
                    timestamp: intTimestamp,
                    code: intResponseCode,
                    value: objValue
                };

                // emit response queue updated event
                App.Events.emit('responseQueueUpdated', strKey);
            }

            return;
        }

        // if not exist simply push to array
        ResponseQueue[strKey] = {
            timestamp: intTimestamp,
            code: intResponseCode,
            value: objValue
        };

        // emit response queue updated event
        App.Events.emit('responseQueueUpdated', strKey);
    }


    function get(strKey, strEndpoint, objData)
    {
        _request(strKey, 'GET', strEndpoint, objData);
    }


    function post(strKey, strEndpoint, objData)
    {
        _request(strKey, 'POST', strEndpoint, objData);
    }


    function put(strKey, strEndpoint, objData)
    {
        _request(strKey, 'PUT', strEndpoint, objData);
    }


    function del(strKey, strEndpoint, objData)
    {
        _request(strKey, 'DELETE', strEndpoint, objData);
    }


    function getResponseFor(strKey)
    {
        var objResponse = null;

        if(typeof ResponseQueue[strKey] != 'undefined')
        {
            objResponse = ResponseQueue[strKey];
        }

        return objResponse;
    }


    // public methods and properties
    return {
        get: function(strKey, strEndpoint, objData){ get(strKey, strEndpoint, objData); },
        post: function(strKey, strEndpoint, objData){ post(strKey, strEndpoint, objData); },
        put: function(strKey, strEndpoint, objData){ put(strKey, strEndpoint, objData); },
        del: function(strKey, strEndpoint, objData){ del(strKey, strEndpoint, objData); },
        getResponseFor: function(strKey){ return getResponseFor(strKey); },
        ResponseCode: ResponseCode,
        SuccessResponses: SuccessResponses,
        ErrorResponses: ErrorResponses
    };

})();


// _______________________________________________________________________________________________________ Router Object


App.Router = (function()
{
    // get container
    const _$mainContainer = $('#divMain');

    // set loading message
    const _strLoader = '<div class="container">' +
        '<div class="row text-center">' +
        '<h4><i class="fa fa-circle-o-notch fa-spin"></i> LOADING...</h4>' +
        '</div>' +
        '</div>';

    // store current module
    var _strCurrentModule = "";


    // bind events
    $(window).on('hashchange', function(event){ _loadModule(location.hash); });


    function _loadModule(strLocationHash)
    {
        // unload the current module
        if(_strCurrentModule !== "")
        {
            _unloadCurrentModule(_strCurrentModule);
        }

        // check whether session is valid
        if(!App.Session.isValid())
        {
            App.Modules.Login.logout();
            return;
        }

        // get permissions of the module
        const arrPermissions = _getPermissions(strLocationHash);

        // check whether the route is permitted
        if(arrPermissions === null)
        {
            // load default module
            loadDefault();
            return;
        }

        if(strLocationHash.substr(0, 1) == '#')
        {
            // get module name
            const strModuleName = _getModuleName(strLocationHash);

            // get module path
            const strModulePath = _getModulePath(strLocationHash);

            _$mainContainer.html(_strLoader);

            // load module
            _$mainContainer.load(strModulePath, function ()
            {
                // set as current module
                _strCurrentModule = strLocationHash;

                // run init of the module
                App.Modules[strModuleName].init(arrPermissions);

                // hide sidenav
                App.Components.SideNav.hide();
            });
        }
    }


    function _unloadCurrentModule()
    {
        // get module name
        const strModuleName = _getModuleName(_strCurrentModule);

        // run destroy of module
        App.Modules[strModuleName].destroy();

        // unload module
        delete App.Modules[strModuleName];
    }


    function _getModuleName(strLocationHash)
    {
        var strModuleName = strLocationHash.substring(1, strLocationHash.length);
        var arrModuleName = strModuleName.split('_');
        var strReturn = "";

        $.each(arrModuleName, function(intIndex, strValue)
        {
            strReturn += strValue.charAt(0).toUpperCase() + strValue.slice(1);
        });

        return strReturn;
    }


    function _getModulePath(strLocationHash)
    {
        var strModuleName = strLocationHash.substring(1, strLocationHash.length);

        return "modules/" + strModuleName + ".html";
    }


    function _getPermissions(strLocationHash)
    {
        const objPermittedRouts = App.Session.getPermittedRouts();
        const strKey = strLocationHash.substring(1, strLocationHash.length);

        if(strKey in objPermittedRouts)
        {
            return objPermittedRouts[strKey];
        }

        return null;
    }


    function init()
    {
        App.Components.SideNav.init();
        App.Components.MainNav.show();

        _loadModule(location.hash);
    }


    function reset()
    {
        location.hash = '';
        _$mainContainer.html("");
    }


    function loadDefault()
    {
        location.hash = App.Session.getDefaultRoute();
    }


    return {
        init: init,
        reset: reset,
        loadDefault: loadDefault
    };

})();


// ____________________________________________________________________________________________________ Validator Object


App.Validator = (function()
{
    $.validator.setDefaults({
        errorClass: 'text-danger',
        highlight: function(element)
        {
            $(element).closest('.form-group').addClass('has-danger');
        },
        unhighlight: function(element)
        {
            $(element).closest('.form-group').removeClass('has-danger');
        },
        errorPlacement: function(error, element)
        {
            if(element.prop('type') === 'checkbox')
            {
                error.insertAfter(element.parent());
            }
            else
            {
                error.insertAfter(element);
            }
        }
    });


    function validateForm(objForm, objRules)
    {
        return objForm.validate(objRules);
    }


    function reset(objValidator)
    {
        if(objValidator !== null)
        {
            objValidator.resetForm();
        }
    }


    function showServerValidationErrors(objResponseData)
    {
        // validation errors
        var strMessage = "<strong>Validation Errors</strong><ul>";

        $.each(objResponseData['errors'], function(intIndex, arrErrors)
        {
            $.each(arrErrors, function(intErrIndex, strError)
            {
                strMessage += "<li>" + strError + "</li>";
            });
        });

        strMessage += "</ul>";

        App.Components.Notification.danger(strMessage);
    }


    return {
        validateForm: function(objForm, objRules){ return validateForm(objForm, objRules); },
        reset: function(objValidator){ reset(objValidator) },
        showServerValidationErrors: function(objResponseData){ showServerValidationErrors(objResponseData); }
    };

})();


// ______________________________________________________________________________________________________ Helpers Object

App.Helpers = {

};


App.Helpers.Error = (function()
{
    function showResponseErrors(objResponseData)
    {
        var strMessage = objResponseData['error'].message;

        if(strMessage == undefined || strMessage == "")
        {
            strMessage = "Unknown Exception" +
                "<br>code " + objResponseData['error'].code +
                "<br>in " + objResponseData['error'].file +
                "<br>at line " + objResponseData['error'].line;
        }

        App.Components.Notification.danger("<strong>" + strMessage + "</strong>");
    }


    return {
        showResponseErrors: function(objResponseData){ showResponseErrors(objResponseData); }
    };

})();


App.Helpers.UI = (function()
{
    const _strSpinner = '<i class="fa fa-circle-o-notch fa-spin fa-fw fa-lg"></i> ';
    const _strHorizontalLoader = '<div id="ldrHorizontal" class="loader-horizontal"></div>';
    var _objCurrentButton = null;
    var _strCurrentButtonCaption = '';


    function toggleButtonState(objButton, strState)
    {
        if(strState === 'loading')
        {
            // reset the last button
            if(_objCurrentButton !== null)
            {
                _objCurrentButton.prop('disabled', false);
                _objCurrentButton.html(_strCurrentButtonCaption);
            }

            // remember the current button
            _objCurrentButton = objButton;
            _strCurrentButtonCaption = objButton.html();

            objButton.prop('disabled', true);

            // check whether the button caption is an icon only
            if(objButton.html().match("^<i") && objButton.html().match("i>$"))
            {
                objButton.html(_strSpinner);
            }
            else
            {
                objButton.html(_strSpinner + objButton.html());
            }


            return;
        }

        if(strState === 'reset')
        {
            if(objButton === null && _objCurrentButton !== null)
            {
                _objCurrentButton.prop('disabled', false);
                _objCurrentButton.html(_strCurrentButtonCaption);

                return;
            }

            objButton.prop('disabled', false);
            objButton.html("Save");
        }
    }


    function toggleHorizontalLoader(objPlaceholder, strState)
    {
        if(strState === 'loading')
        {
            // add loader before element
            objPlaceholder.before(_strHorizontalLoader);
        }

        if(strState === 'reset')
        {
            var objLoader = objPlaceholder.prev();

            // remove loader of the element
            if(objLoader.prop('id') == "ldrHorizontal")
            {
                objLoader.remove();
            }
        }
    }


    function renderDropdownOptions(objKeyValMap, arrData)
    {
        var strOptions = "";

        // create options
        $.each(arrData, function(intIndex, objRow)
        {
            strOptions += '<option value="' + objRow[objKeyValMap.id] + '">' + objRow[objKeyValMap.name] + '</option>';
        });

        return strOptions;
    }


    return {
        toggleButtonState: function(objButton, strState){ toggleButtonState(objButton, strState); },
        toggleHorizontalLoader: function(objPlaceholder, strState){ toggleHorizontalLoader(objPlaceholder, strState); },
        renderDropdownOptions: function(objKeyValMap, arrData){ return renderDropdownOptions(objKeyValMap, arrData); }
    };

})();


// ______________________________________________________________________________________________________ Modules Object


// container to hold all modules
App.Modules = {

};


// ___________________________________________________________________________________________________ Components Object


// container to hold all components
App.Components = {

};


// ___________________________________________________________________________________________ Main Navigation Component


App.Components.MainNav = (function()
{
    // get container
    const _$navMain = $('#navMain');

    // locate elements in container
    const _$lblUserName = _$navMain.find('#lblUserName');
    const _$lnkLogout = _$navMain.find('#lnkLogout');


    // bind events
    _$lnkLogout.on('click', function(){ App.Modules.Login.logout(); });


    function init()
    {
        const objUser = App.Session.getUser();

        _$lblUserName.html(objUser.name)
    }


    function show()
    {
        init();
        _$navMain.removeClass('invisible');
    }


    function hide()
    {
        _$navMain.addClass('invisible');
    }


    // provide public methods
    return {
        show: show,
        hide: hide
    };

})();


// ___________________________________________________________________________________________ Side Navigation Component


App.Components.SideNav = (function()
{
    // get container
    const _$divSideNav = $('#divSideNav');
    const _$mainContainer = $('#divMain');


    // hide side nav when clicked on main container
    _$mainContainer.on('click', function ()
    {
        hide();
    });


    function init()
    {
        _$divSideNav.html(_generateContent());
    }


    function _generateContent()
    {
        const objRouts = App.Session.getRouts();

        var strContent = '<nav class="sidenav">';
        var strGroupName = "";

        $.each(objRouts.routs, function(intGroupIndex, objGroup)
        {
            // remove whitespaces and convert to lower case
            strGroupName = objGroup.group.replace(/\s+/g, '').toLowerCase();

            strContent += '<a class="collapsed sidenav-group-header" ' +
                                'data-toggle="collapse" ' +
                                'href="#' + strGroupName + '" ' +
                                'aria-expanded="false">' + objGroup.group + '</a>' +
                            '<div class="collapse sidenav-group" ' +
                                'id="' + strGroupName + '" ' +
                                'aria-expanded="false">';

            $.each(objGroup.modules, function(intItemIndex, objItem)
            {
                strContent += '<a class="nav-item nav-link sidenav-link pl-lg py-sm" ' +
                                'href="#' + objItem.route + '">' +
                                '<i class="fa fa-angle-double-right fa-fw pr-4"></i>&nbsp;' + objItem.name + '</a>';
            });

            strContent += '</div>';
        });

        strContent += '</nav>';

        return strContent;
    }


    function toggle()
    {
        if(_$divSideNav.width() == 0)
        {
            _$divSideNav.width(250);
        }
        else
        {
            _$divSideNav.width(0);
        }
    }


    function show()
    {
        _$divSideNav.width(250);
    }


    function hide()
    {
        _$divSideNav.removeClass("pmd-sidebar-open");
    }


    return {
        init: init,
        show:show,
        hide: hide,
        toggle: toggle
    };

})();


// _______________________________________________________________________________________ Global Notification Component


App.Components.Notification = (function()
{
    function _notify(strMessage, objOptions)
    {
        var objOptionDefaults = {
            placement: {
                from: "top",
                align: "center"
            },
            z_index: 2000
        };

        $.extend(objOptionDefaults, objOptions);

        $.notify({
            message: strMessage
        },
        objOptionDefaults);
    }


    function success(strMessage)
    {
        const objOptions = {
            type: 'success'
        };

        _notify(strMessage, objOptions);
    }


    function info(strMessage)
    {
        const objOptions = {
            type: 'info'
        };

        _notify(strMessage, objOptions);
    }


    function warning(strMessage)
    {
        const objOptions = {
            type: 'warning'
        };

        _notify(strMessage, objOptions);
    }


    function danger(strMessage)
    {
        const objOptions = {
            type: 'danger'
        };

        _notify(strMessage, objOptions);
    }


    return {
        success: function(strMessage){ success(strMessage); },
        info: function(strMessage){ info(strMessage); },
        warning: function(strMessage){ warning(strMessage); },
        danger: function(strMessage){ danger(strMessage); }
    };

})();


// ________________________________________________________________________________________________________ Login Module


App.Modules.Login = (function()
{
    // get container
    const _$mdlLogin = $('#mdlLogin');

    // locate elements in container
    const _$frmLogin = _$mdlLogin.find('#frmLogin');
    const _$txtEmail = _$mdlLogin.find('#txtEmail');
    const _$txtPassword = _$mdlLogin.find('#txtPassword');
    const _$btnLogin = _$mdlLogin.find('#btnLogin');

    // validation rules
    const _objValidationRules = {
        rules: {
            txtEmail: {
                required: true,
                email: true
            },
            txtPassword: {
                required: true
            }
        }
    };

    // create session data
    var _objSessionData = {
        "token": "",
        "permissions": {}
    };


    // bind events
    _$frmLogin.on('keyup', function(event){ if(event.keyCode == 13){ _$btnLogin.click(); } });
    _$btnLogin.on('click', _login);


    // listen to response queue changes
    App.Events.on('responseQueueUpdated', function(strKey) { _delegateResponse(strKey); });


    // delegate the response
    function _delegateResponse(strKey)
    {
        // get the response
        const objResponse = App.Request.getResponseFor(strKey);

        switch(strKey)
        {
            case 'login_auth':
                _authenticate(objResponse);
                break;

            case 'login_permission':
                _setAuthorizations(objResponse);
                break;
        }
    }


    function _toggleButtonState(objButton, strState)
    {
        if(strState === 'loading')
        {
            objButton.prop('disabled', true);
            objButton.html("<i class='fa fa-circle-o-notch fa-spin'></i> Loggin in");
        }

        if(strState === 'reset')
        {
            objButton.prop('disabled', false);
            objButton.html("Login");
        }
    }


    function _reset()
    {
        _$txtEmail.val('');
        _$txtPassword.val('');
        _toggleButtonState(_$btnLogin, 'reset');
    }


    function _login()
    {
        // validate the form
        App.Validator.validateForm(_$frmLogin, _objValidationRules);

        // when invalid
        if(!_$frmLogin.valid())
        {
            return;
        }

        // request data
        const objData = {
            email: _$txtEmail.val(),
            password: _$txtPassword.val()
        };

        // disable login button
        _toggleButtonState(_$btnLogin, 'loading');

        // make the authentication request
        App.Request.post('login_auth', App.Settings.ApiEndpoints.AUTH, objData);
    }


    function _authenticate(objResponse)
    {
        const objResponseData = objResponse.value;
        const intResponseStatus = objResponse.code;

        // success
        if(intResponseStatus === App.Request.ResponseCode.OK)
        {
            _objSessionData.token = objResponseData['data'].token;

            // request data
            const objData = {
                token: _objSessionData.token
            };

            // make the authorization request
            App.Request.get('login_permission', App.Settings.ApiEndpoints.PERMISSION, objData);

            return;
        }

        // error
        if($.inArray(objResponse.code, App.Request.ErrorResponses) !== -1)
        {
            // validation error
            if(objResponse.code === App.Request.ResponseCode.UNPROCESSABLE)
            {
                App.Validator.showServerValidationErrors(objResponseData);
            }

            // server error
            if(objResponse.code === App.Request.ResponseCode.SERVER_ERROR)
            {
                App.Helpers.Error.showResponseErrors(objResponseData);
            }

            // enable login button
            _toggleButtonState(_$btnLogin, 'reset');
        }
    }


    function _setAuthorizations(objResponse)
    {
        const objResponseData = objResponse.value;
        const intResponseStatus = objResponse.code;

        // success
        if(intResponseStatus === App.Request.ResponseCode.OK)
        {
            // add permissions
            _objSessionData.permissions = objResponseData['data'];

            // init app
            _initApp();

            return;
        }

        // error
        if(intResponseStatus === App.Request.ResponseCode.SERVER_ERROR)
        {
            // show error
            App.Helpers.Error.showResponseErrors(objResponseData);
        }
    }


    function _initApp()
    {
        // save token, user and sidenav in session
        App.Session.init(_objSessionData);

        // initialize side navigation
        App.Components.SideNav.init();

        // show main navigation
        App.Components.MainNav.show();

        // load default module
        App.Router.loadDefault();

        // hide login module
        hide();

        // reset login
        _reset();
    }


    function show()
    {
        _$mdlLogin.modal({keyboard: false, backdrop: false, show: true, focus: true});
    }


    function hide()
    {
        _$mdlLogin.modal('hide');
    }


    function logout()
    {
        // reset app
        App.reset();
    }


    // provide public methods
    return {
        show: show,
        hide: hide,
        logout: logout
    };

})();
