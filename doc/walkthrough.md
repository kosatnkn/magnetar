<div align="center"><img src ="doc/magnetar_logo.png"/></div>

# Create a Module

To understand the architecture of a module open a sample module in the `modules` directory.

## Naming a Module

The naming convention of the module object is very important.
Module class name should be the `Pascal Case` version of the file name without underscores.
And it should be namespaced as `App.Modules`

> ex: `App.Modules.ModuleName`

Following table shows how routs, files and module class should be named for different modules.

Route | Module File | Module Class
--- | --- | ---
`#action` | `action.html` | `App.Modules.Action`
`#another_action` | `another_action.html` | `App.Modules.AnotherAction`
`#much_complex_action` | `much_complex_action.html` | `App.Modules.MuchComplexAction`


## Module Structure

A module has two main parts.

- UI Interface (only use html and css classes)
- JavaScript Object (driver logic for the module enclosed in a namespaced object)


### UI Interface
The UI interface part is in a `div` element with an id. This entire element is cached when
the module loads.

```xhtml
<div class="container" id="divAction">

    <!-- 
        UI is defined here.
        Make sure that you name components properly and avoid using inline styling
        and don't write JavaScript snippets within html.
        And also don't import .css files or .js files in to the module.
        All your imports has to be done in `index.html`
    -->
    
</div>
```


### JavaScript Object

```xhtml
<script>

    App.Modules.Action = (function()
    {
        // ...
        // Module specific logic 
        // ...
        
        
        // _________________________________________________________________________ Public
        
        function init()
        {
            // ...
            // functions to run when module initializes
            // ...

            // NOTE: Make sure you init tooltips and popover after rendering the view.
            //       You sort of has to do this. Otherwise tooltips and popovers will not 
            //       work within the loaded module.
            // init tooltips
            $('[data-toggle="tooltip"]').tooltip();

            // init popover
            $('[data-toggle="popover"]').popover();
        }


        function destroy()
        {
            // stop listening to responseQueueUpdated event
            App.Events.off('responseQueueUpdated', _delegateResponse);
        }


        return {
            init: init,
            destroy: destroy
        };
        
    })();
    

</script>
```

- [Naming Conventions](#naming-conventions)
- [Declarations](#declarations)
- [UI Event Binding](#ui-event-binding)
- [REST Event Binding and Delegation](#rest-event-binding-and-delegation)
- [REST Event Handlers](#rest-event-handlers)
- [UI Manipulations](#ui-manipulations)
- [Server Requests](#server-requests)
- [Public](#public)


### Naming Conventions

- Prefix UI element `names` and `ids` with element type. (ex: divMain, txtName, drpSelect)
- Prefix variable names with data type. (ex: strName, intValue, arrList)
- Prefix `private` variable and method names with an underscore. (ex: _arrPermission, _delegateResponse())
- Prefix jQuery representations of objects with a `$`. (ex: _$btnAdd)


### Declarations

You cache the `dom` here and use the cached `dom` to get other elements in UI.
Using this method will greatly increase your SPAs performance since the `dom` will be traversed only once.

```javascript
    // get container (cache the container)
    // NOTE: this is the topmost `div` element of the UI part of the module
    const _$divMain = $('#divAction'); 

    // locate elements in cached container
    // NOTE: from this point onwards use the jQuery `find` method
    const _$btnAdd = _$divMain.find('#btnAdd');
    const _$grdActions = _$divMain.find('#grdActions');
    const _$mdlAddEdit = _$divMain.find('#mdlAddEdit');
    
    // define validation rules
    var _objValidator = null;

    const _objValidationRules = {
        rules: {
            txtName: {
                required: true,
                pattern: /^[a-z_]+$/ // lowercase and underscore only
            },
            txtDesc: {
                required: true
            }
        },
        messages: {
            txtName: {
                pattern: "Use 'lowercase' words and '_' only. (ex: example_action)"
            }
        }
    };
```


### UI Event Binding

```javascript
    _$btnAdd.on('click', function(event) { _showAddEditModel('add'); });
    
    _$grdActions.on('click', '.action-edit', function(event) { _getItem($(this)); });
    
    _$btnCancel.on('click', function(event) { _hideAddEditModel(); });
    _$btnSave.on('click', function(event) { _save(); });
```


### REST Event Binding and Delegation

```javascript
    // listen to response queue changes
    App.Events.on('responseQueueUpdated', function(strKey) { _delegateResponse(strKey); });


    // delegate the response
    function _delegateResponse(strKey)
    {
        // get the response
        const objResponse = App.Request.getResponseFor(strKey);

        switch(strKey)
        {
            case 'action_list':
                _receivedList(objResponse);
                break;

            case 'action_item':
                _receivedItem(objResponse);
                break;

            case 'action_item_add':
                _added(objResponse);
                break;

            case 'action_item_edit':
                _edited(objResponse);
                break;
        }
    }
```


### REST Event Handlers

```javascript
    function _added(objResponse)
    {
        const objResponseData = objResponse.value;

        // success
        if(objResponse.code === App.Request.ResponseCode.CREATED)
        {
            // show success message
            App.Components.Notification.success("<strong>Action added successfully</strong>");

            // reset and hide modal
            _resetAddEditModal('add');
            _hideAddEditModel();

            // reload action grid
            App.Request.get('action_list', App.Settings.ApiEndpoints.ACTION_GET_LIST, {});

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

            // reset save button
            App.Helpers.UI.toggleButtonState(_$btnSave, 'reset');
        }
    }
```


### UI Manipulations

```javascript
    function _showAddEditModel(strMode)
    {
        _resetAddEditModal(strMode);
        _$mdlAddEdit.modal({keyboard: true, backdrop: false, show: true, focus: true});
    }
```


### Server Requests

Server requests require a `unique` key string to keep track of the response.
`App.Request` object uses this key to hold the response of this request.
When the response comes `App.Request` will emit the `responseQueueUpdated` event which you have to
listen to.

```javascript
    function _getItem(objEditButton)
    {
        // disable edit button
        App.Helpers.UI.toggleButtonState(objEditButton, 'loading');

        // make the action item get request
        const objData = {
            name: _$txtName.val()
        };

        App.Request.get('action_item', App.Settings.ApiEndpoints.ACTION_GET_BY_ID, objData);
    }
```


#### Placeholders in Route

Sometimes you have placeholders in the route path.

```javascript
    http://api_url/action/{id}
```

In such situations what you have to do is to simply put the placeholder name and its corresponding
value in to `objData`.

```javascript
    // add the placeholder name and value to objData
    const objData = {
        id: objEditButton.val()
    };

    App.Request.get('action_item', App.Settings.ApiEndpoints.ACTION_GET_BY_ID, objData);
```


#### GET, POST, PUT and DELETE

```javascript
    App.Request.get(strKey, strEndpoint, objData); // GET request
    App.Request.post(strKey, strEndpoint, objData, arrFiles, objProgress); // POST request
    App.Request.put(strKey, strEndpoint, objData, arrFiles, objProgress); // PUT request
    App.Request.del(strKey, strEndpoint, objData); // DELETE request
```


#### Upload Files with Progress

You can upload multiple files with `POST` and `PUT` requests.

```javascript
    //
    const _$pgbUpload = _$divMain.find('#pgbUpload');
    
    // request data
    const objData = {
        name: _$txtName.val()
    };

    // selected files from a `file` input element
    const arrFiles = _$fleUpload.prop('files');

    // make the setting item add request
    App.Request.post('upload_files', 
                        App.Settings.ApiEndpoints.UPLOAD_FILES, 
                        objData, 
                        arrFiles, 
                        _$pgbUpload
    );
```

When you send a jQuery object of a progress bar it will update it as the file upload progresses.

For this to work the progress element should be in the following format.

```xhtml
    <!-- progress bar -->
    <div id="pgbUploadCSV" class="progress">
        <div class="progress-bar progress-bar-primary" style="width: 0%;"></div>
    </div>
```


### Public

This section contains two mandatory methods `init()` and `destroy()`

- As soon as a module is loaded `App.Router` executes the modules `init()` method
- Just before unloading a module `App.Router` executes the modules `destroy()` method
