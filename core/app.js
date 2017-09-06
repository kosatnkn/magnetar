/*
 * Magnetar Core v1.0.0
 * 2017.08.18
 *
 * By Kosala Tennakoon of Sri Lanka
 */


// __________________________________________________________________________________________________________ App Module


const App = (function()
{
    /**
     * Run application.
     *  (NOTE: This is the main entry point to the app)
     */
    function run()
    {
        // check local storage for a session
        if(!App.Session.isValid())
        {
            reset();
            return;
        }

        App.Components.SideNav.init();
        App.Components.MainNav.show();

        // when session valid, set app status using the urls hash part
        App.Router.init();
    }

    /**
     * Reset the application to it's default state.
     */
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
        UserAction: UserAction,
        FilterOperator: FilterOperator,
        ApiEndpoints: ApiEndpoints
    };

})();


// ______________________________________________________________________________________________________ Session Object

App.Session = (function()
{
    /**
     * Initialize the session.
     *
     * @param objData
     */
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


    /**
     * Compile a list of permitted routs using permissions.
     *
     * @param objPermissions
     * @returns {{}}
     * @private
     */
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


    /**
     * Check whether the session is valid.
     *
     * @returns {boolean}
     */
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


    /**
     * Get authentication token.
     *
     * @returns {string|*}
     */
    function getToken()
    {
        return JSON.parse(localStorage.getItem(App.Settings.AppName)).token;
    }


    /**
     * Get the user object.
     *
     * @returns {*}
     */
    function getUser()
    {
        return JSON.parse(localStorage.getItem(App.Settings.AppName)).user;
    }


    /**
     * Get the list of routs and their associated permissions.
     *
     * @returns {permissions|{}|*}
     */
    function getRouts()
    {
        return JSON.parse(localStorage.getItem(App.Settings.AppName)).routs;
    }


    /**
     * Get the list of permitted routs.
     *
     * @returns {{}|*}
     */
    function getPermittedRouts()
    {
        return JSON.parse(localStorage.getItem(App.Settings.AppName)).permitted;
    }


    /**
     * Get the default route.
     *
     * @returns {string}
     */
    function getDefaultRoute()
    {
        return '#' + getRouts().default;
    }


    /**
     * Destroy the session.
     */
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


    /**
     * Subscribe for an event.
     *
     * @param eventName
     * @param fn
     */
    function on(eventName, fn)
    {
        events[eventName] = events[eventName] || [];
        events[eventName].push(fn);
    }


    /**
     * Unsubscribe from an event.
     *
     * @param eventName
     * @param fn
     */
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


    /**
     * Trigger an event.
     *
     * @param eventName
     * @param data
     */
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
        emit: function(eventName, data) { emit(eventName, data); }
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


    /**
     * Make the request.
     *
     * @param strKey
     * @param strMethod
     * @param strEndpoint
     * @param objData
     * @param arrFiles
     * @param objProgress
     * @private
     */
    function _request(strKey, strMethod, strEndpoint, objData, arrFiles, objProgress)
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

        // add token to request header
        _addTokenToAuthRoute(strEndpoint);

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

        // create request object
        var objRequest = {
            type: strMethod,
            url: strEndpoint,
            headers: _objRequestHeader,
            success: function(objResult, strStatus, objXHR)
            {
                _updateResponseQueue(strKey, objXHR.status, intTimestamp, objResult);
            },
            error: function(objXHR, strStatus)
            {
                _updateResponseQueue(strKey, objXHR.status , intTimestamp, objXHR.responseJSON);
            }
        };

        // modify request object and data object if there are files to be uploaded
        if(!(arrFiles === undefined || arrFiles === null))
        {
            // modify data object
            var objFormData = new FormData();

            // when there is only one file
            if(arrFiles.length === 1)
            {
                // add file to data object
                objFormData.append("file", arrFiles[0]);
            }

            // when there are more than one file
            if(arrFiles.length > 1)
            {
                for (var i = 0; i < arrFiles.length; i++)
                {
                    // add file to data object
                    objFormData.append("file_" + (i + 1), arrFiles[i]);
                }
            }

            // add rest of the data as a string under the 'data' key
            objFormData.append("data", JSON.stringify(objData));

            // reassign form data object to data object
            objData = objFormData;


            // modify request object
            objRequest.processData = false;
            objRequest.contentType = false;
        }

        // show progress
        if(!(objProgress === undefined || objProgress === null))
        {
            // get progress bar from the progress control
            const objBar = objProgress.find('.progress-bar');

            objRequest.xhr = function()
            {
                var objXHR = $.ajaxSettings.xhr();

                if(objXHR.upload)
                {
                    objXHR.upload.addEventListener('progress', function(event)
                    {
                        var intPercent = 0;
                        var intPosition = event.loaded || event.position;
                        var intTotal = event.total;

                        if(event.lengthComputable)
                        {
                            intPercent = Math.ceil(intPosition / intTotal * 100);
                        }

                        //update progress
                        objBar.css("width", intPercent + "%");

                    }, true);
                }

                return objXHR;
            }
        }

        // add data to request
        objRequest.data = objData;

        // make the request
        $.ajax(objRequest);
    }


    /**
     * Add authentication token to authenticatable route.
     *
     * @param strEndpoint
     * @private
     */
    function _addTokenToAuthRoute(strEndpoint)
    {
        if($.inArray(strEndpoint, _arrUnauthenticatedRouts) === -1)
        {
            _objRequestHeader.Authorization = 'Bearer ' + App.Session.getToken();

            return;
        }

        delete _objRequestHeader['Authorization'];
    }


    /**
     * Update the response queue.
     *
     * @param strKey
     * @param intResponseCode
     * @param intTimestamp
     * @param objValue
     * @private
     */
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


    /**
     * Make a 'GET' request.
     *
     * @param strKey
     * @param strEndpoint
     * @param objData
     */
    function get(strKey, strEndpoint, objData)
    {
        _request(strKey, 'GET', strEndpoint, objData, null);
    }


    /**
     * Make a 'POST' request.
     *
     * @param strKey
     * @param strEndpoint
     * @param objData
     * @param arrFiles
     * @param objProgress
     */
    function post(strKey, strEndpoint, objData, arrFiles, objProgress)
    {
        _request(strKey, 'POST', strEndpoint, objData, arrFiles, objProgress);
    }


    /**
     * Make a 'PUT' request.
     *
     * @param strKey
     * @param strEndpoint
     * @param objData
     * @param arrFiles
     * @param objProgress
     */
    function put(strKey, strEndpoint, objData , arrFiles, objProgress)
    {
        _request(strKey, 'PUT', strEndpoint, objData, arrFiles, objProgress);
    }


    /**
     * Make a 'DELETE' request.
     *
     * @param strKey
     * @param strEndpoint
     * @param objData
     */
    function del(strKey, strEndpoint, objData)
    {
        _request(strKey, 'DELETE', strEndpoint, objData);
    }


    /**
     * Get response data returned by a request using the key used to make that request.
     *
     * @param strKey
     * @returns {*}
     */
    function getResponseFor(strKey)
    {
        if(typeof ResponseQueue[strKey] != 'undefined')
        {
            return ResponseQueue[strKey];
        }

        return null;
    }


    // public methods and properties
    return {
        get: function(strKey, strEndpoint, objData){ get(strKey, strEndpoint, objData); },
        post: function(strKey, strEndpoint, objData, arrFiles, objProgress){ post(strKey, strEndpoint, objData, arrFiles, objProgress); },
        put: function(strKey, strEndpoint, objData, arrFiles, objProgress){ put(strKey, strEndpoint, objData, arrFiles, objProgress); },
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


    /**
     * Load a module using a location hash.
     *
     * @param strLocationHash
     *
     * @private
     */
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


    /**
     * Unload the currently loaded module.
     *
     * @private
     */
    function _unloadCurrentModule()
    {
        // get module name
        const strModuleName = _getModuleName(_strCurrentModule);

        // run destroy of module
        App.Modules[strModuleName].destroy();

        // unload module
        delete App.Modules[strModuleName];
    }


    /**
     * Generate the module class name using the location hash.
     *
     * @param strLocationHash
     * @returns {string}
     * @private
     */
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


    /**
     * Generate the path to module file in the server using the location hash.
     *
     * @param strLocationHash
     * @returns {string}
     * @private
     */
    function _getModulePath(strLocationHash)
    {
        var strModuleName = strLocationHash.substring(1, strLocationHash.length);

        return "modules/" + strModuleName + ".html";
    }


    /**
     * Get user permissions assigned to a specific module using the location hash.
     *
     * @param strLocationHash
     * @returns {*}
     * @private
     */
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


    /**
     * Initialize the router.
     */
    function init()
    {
        _loadModule(location.hash);
    }


    /**
     * Reset the router.
     */
    function reset()
    {
        location.hash = '';
        _$mainContainer.html("");
    }


    /**
     * Load the default module.
     */
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
            else if(element.prop('type') === 'text' && element.parent().hasClass('input-group'))
            {
                error.insertAfter(element.parent());
            }
            else
            {
                error.insertAfter(element);
            }
        }
    });


    /**
     * Validate a given jQuery form object using a validation rules object.
     *
     * @param objForm
     * @param objRules
     * @returns {*}
     */
    function validateForm(objForm, objRules)
    {
        return objForm.validate(objRules);
    }


    /**
     * Reset the validator.
     *
     * @param objValidator
     */
    function reset(objValidator)
    {
        if(objValidator !== null)
        {
            objValidator.resetForm();
        }
    }


    /**
     * Show validation errors thrown from the API using the global notification interface.
     *
     * @param objResponseData
     */
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
    /**
     * Show server errors thrown from the API using the global notification interface.
     *
     * @param objResponseData
     */
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


    /**
     * Initialize the main navigator.
     */
    function init()
    {
        const objUser = App.Session.getUser();

        _$lblUserName.html(objUser.name)
    }


    /**
     * Show the main navigator.
     */
    function show()
    {
        init();
        _$navMain.removeClass('invisible');
    }


    /**
     * Hide the main navigator.
     */
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


    /**
     * Initialize the side navigator.
     */
    function init()
    {
        _$divSideNav.html(_generateContent());
    }


    /**
     * Generate the menu list for the side navigator.
     *
     * @returns {string}
     * @private
     */
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


    /**
     * Toggle visibility of the side navigator.
     */
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


    /**
     * Show the side navigator.
     */
    function show()
    {
        _$divSideNav.width(250);
    }


    /**
     * Hide the side navigator.
     */
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
    /**
     * Show a notification message.
     *
     * @param strMessage
     * @param objOptions
     * @private
     */
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


    /**
     * Show a success message.
     *
     * @param strMessage
     */
    function success(strMessage)
    {
        const objOptions = {
            type: 'success'
        };

        _notify(strMessage, objOptions);
    }


    /**
     * Show an information message.
     *
     * @param strMessage
     */
    function info(strMessage)
    {
        const objOptions = {
            type: 'info'
        };

        _notify(strMessage, objOptions);
    }


    /**
     * Show a warning message.
     *
     * @param strMessage
     */
    function warning(strMessage)
    {
        const objOptions = {
            type: 'warning'
        };

        _notify(strMessage, objOptions);
    }


    /**
     * show a danger message.
     *
     * @param strMessage
     */
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


// ____________________________________________________________________________________________________ Button Component

App.Components.Button = (function()
{
    const _strSpinner = '<i class="fa fa-circle-o-notch fa-spin fa-fw fa-lg"></i> ';

    var _objCurrentButton = null;
    var _strCurrentButtonCaption = '';

    /**
     * Toggle button state between loading and normal.
     *
     * @param objButton
     * @param strState
     */
    function toggleState(objButton, strState)
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

            if(! objButton.prop('disabled'))
            {
                return;
            }

            objButton.prop('disabled', false);
            objButton.html(_strCurrentButtonCaption);
        }
    }


    return {
        toggleState: function(objButton, strState){ toggleState(objButton, strState); }
    };

})();


// __________________________________________________________________________________________________ Dropdown Component

App.Components.Dropdown = (function()
{
    /**
     * Generate an options list to a dropdown using a key value array.
     *
     * @param objKeyValMap {id: <array_field_to_map_to_value_property>, name: <array_field_to_display_in_dropdown>}
     * @param arrData
     * @returns {string}
     */
    function renderOptions(objKeyValMap, arrData)
    {
        var strOptions = "";

        // when arrData is empty
        if(arrData.length === 0)
        {
            strOptions = '<option value="" class="text-center text-muted">NO DATA</option>';
            return strOptions;
        }

        // create options
        $.each(arrData, function(intIndex, objRow)
        {
            strOptions += '<option value="' + objRow[objKeyValMap.id] + '">' + objRow[objKeyValMap.name] + '</option>';
        });

        return strOptions;
    }


    return {
        renderOptions: function(objKeyValMap, arrData){ return renderOptions(objKeyValMap, arrData); }
    };
})();


// _____________________________________________________________________________________________ File Selector Component

App.Components.FileSelector = (function()
{
    /**
     * Show the file name of the currently loaded file of a UI file selector.
     *
     * @param objFileSelector
     */
    function renderCaption(objFileSelector)
    {
        const objContainer = objFileSelector.closest('div');
        const lblCaption = objContainer.find('span');

        if(objFileSelector.val() == "")
        {
            lblCaption.html(lblCaption.data('default'));
            return;
        }

        lblCaption.html(objFileSelector.val().split('\\').pop());
    }


    return {
        renderCaption: function(objFileSelector){ renderCaption(objFileSelector); }
    };

})();


// _________________________________________________________________________________________ Horizontal Loader Component

App.Components.HorizontalLoader = (function()
{
    const _strHorizontalLoader = '<div id="ldrHorizontal" class="loader-horizontal"></div>';

    /**
     * Add or remove a horizontal loading indicator to a UI element.
     *
     * @param objPlaceholder
     * @param strState
     */
    function toggleState(objPlaceholder, strState)
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


    return {
        toggleState: function(objPlaceholder, strState){ toggleState(objPlaceholder, strState); }
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


    function _reset()
    {
        _$txtEmail.val('');
        _$txtPassword.val('');
        App.Helpers.UI.toggleButtonState(_$btnLogin, 'reset');
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
        App.Helpers.UI.toggleButtonState(_$btnLogin, 'loading');

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
            App.Helpers.UI.toggleButtonState(_$btnLogin, 'reset');
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

        location.reload();
    }


    // provide public methods
    return {
        show: show,
        hide: hide,
        logout: logout
    };

})();
