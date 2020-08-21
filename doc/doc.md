<div align="center"><img src ="magnetar_logo.png"/></div>

# Magnetar Documentation

### Table of Content

- [Introduction](#introduction)
- [Folder Structure](#folder-structure)
- [Libraries](#libraries)
- [Index File](#index-file)
- [Core (App)](#core)
    - [App.Components](#components)
    - [App.Events](#events)
    - [App.Helpers](#helpers)
    - [App.Modules](#modules)
    - [App.Request](#request)
    - [App.Router](#router)
    - [App.Session](#session)
    - [App.Settings](#settings)
    - [App.Validator](#validator)
    - [App.Modules](#modules)
- [Creating Modules](#creating-modules)
- [How to Combine Everything Together](#how-to-combine-everything-together)


## Introduction

`Magnetar` is aimed at being a web client that can communicate with a RESTful web api.

The idea behind this project is to come up with a JavaScript framework that can be used out of the box for development.
Even without the need to set up a specialized environment using a JavaScript tool set.

Just the plain old JavaScript goodness!

The project will only give you the bare fundamentals. Nothing more than that. So you can decide on what and what not to add.
In most cases the framework will not interfere with your choices.

Magnetar provides following fundamentals that you would need to kickstart your SPA project.

 - JWT support
 - Session support
 - A PubSub to handle user defined events
 - A Request class to deal with communicating with the server (And yes! it can upload files)
 - A Router to load and unload modules and to navigate around
 - A Validator to validate forms
 - Additional Helper functions
 - Header, Side Navigation and Login module already in place

Enjoy!


## Folder Structure

    magnetar
        |- core/
        |    |- app.js
        |- doc/ (documentation)
        |    |- doc.md
        |    |- walkthrough.md
        |    |- magnetar_logo.png
        |- lib/ (libraries)
        |    |- css/
        |        |- bootstrap.css
        |        |- (other required css files)
        |    |- fonts/
        |        |- (required web fonts)
        |    |- js/
        |        |- bootstrap/
        |        |- jquery/
        |        |- jwt/
        |        |- notify/
        |        |- validator/
        |        |- (other js libraries you need)   
        |- modules/
        |    |- (modules that you create)
        |
        |- .gitignore
        |- favicon.ico
        |- index.html (main entry point of application)
        |- README.md


## Libraries

The `lib` folder contains all the CSS files, Fonts and JavaScript libraries that you would use with `Magnetar`.
Of these, following libraries are essential for `Magnetar` to work.

- [jQuery](https://github.com/jquery/jquery)
- [JWT Decoder](https://github.com/auth0/jwt-decode)
- [Bootstrap Notify](https://github.com/mouse0270/bootstrap-notify)
- [jQuery Validator](https://github.com/jquery-validation/jquery-validation)

By default `Magnetar` uses Bootstrap Bootstrap-Yeti and Propeller as its css frameworks. But you can easily change these
to any other bootstrap based frameworks. It is also possible to change it in to some entirely different css framework.
However to do so you would have to tinker the core of `Magnetar` a little.

- [Bootstrap](https://github.com/twbs/bootstrap)
- [Propeller](https://github.com/digicorp/propeller)
- [Animate CSS](https://github.com/daneden/animate.css)
- [Font Awesome](https://github.com/FortAwesome/Font-Awesome)


## Index File

`index.html` is the main page that is loaded. Everything else is loaded in to this page.

> You should load all .css and .js files here and only here. 
> After loading all that you should load the `core/app.js` file at the very end of the file.  

You can define the base template of your `SPA (Single Page Application)` here.

At the very end of the file you need to put a `<script>` block and add the following code segment.
This will initialize the application and run it.

```xhtml
<script>

    $(document).ready(function()
    {
        // start the app
        App.run();

    });

</script>
```


## Core

The core of `Magnetar` is at `core/app.js`.
At run time the entire application is encapsulated in an object named `App`.

`Magnetar` is written using the modular JavaScript programming approach.
Each aspects of the application is in its own object under the main `App` object.

If you typed `App` in the console of the browser and press `ENTER` when the application is running you can view the
entire structure of the application running at that time.

Following are the main objects of `Magnetar`


#### Components

`App.Components` contain Main Navigation, Side Navigation and Notification.


#### Events

`App.Events` is the custom event Pub/Sub of `Magnetar`.


#### Helpers

There are several helper methods in `App.Helpers` to do common UI manipulations and error handling.


#### Modules

`App.Modules` contain all operation logic of loaded modules. To achieve this you have to structure actual modules according
to the format specified in the [Creating Modules](#creating-modules) section.

> A module is a part of operational logic coupled with its own UI. In much simpler terms modules are sub pages loaded
> inside the main page to perform a specific task.

> Now don't get confused. What's meant by `Modules` here is `App.Modules`, the object that `Magnetar` uses to keep
> operational logic of loaded modules (.html files that resides in the `modules` folder)


#### Request

`App.Request` is responsible for talking with the server asynchronously using Ajax. It supports RESTful requests and
even multiple file uploads.

```javascript
    App.Request.get(strKey, strEndpoint, objData); // GET request
    App.Request.post(strKey, strEndpoint, objData, arrFiles, objProgress); // POST request
    App.Request.put(strKey, strEndpoint, objData, arrFiles, objProgress); // PUT request
    App.Request.del(strKey, strEndpoint, objData); // DELETE request
```

`strKey` is a unique `string` value that you have to specify with every request you make to the server.
This is used by the `Request` objects `ResponseQueue` management algorithm to handle responses.

> When you do multiple requests using the same key the `Request` module will adjust the `ResponseQueue` only to accept
> the response of the latest request.

Only `POST` and `PUT` requests are capable of uploading files. In addition to that you can pass a `Progress Bar` object
to this method and it will update the progress bar as the upload happens.


#### Router

`App.Router` handles navigation between modules. Under the hood it utilizes the `hashchange` method of `jQuery`.
Because of that you can use browsers Back and Next buttons to navigate around.

> The route name should be as same as the name of the module file.
> As a convention use lowercase letters and underscores for naming both module files and routes.
> 
> ex: if module name is `module_name` the route that loads that model should be `#module_name`.


#### Session

`App.Session` manages a user session in browser's local storage. You can configure the active duration of the session
in `Settings`.


#### Settings

`App.Settings` contain all configurable aspects of the application.

- `AppName` A unique name for the app
- `SessionTimeout` Session timeout in hours
- `ApiUrl` Base url of the backend API
- `ApiEndpoints` All API endpoints that the client can call is in here as a set of key value pairs.

> When you use an endpoint in a request call make sure that you use the endpoint key to refer to the endpoint url.

```javascript
// in App.Settings

const ApiUrl = 'http://api_url/';

const ApiEndpoints = {
    ACTION_GET_LIST: ApiUrl + 'endpoint'
};


// in a module

App.Request.get('action_get_list', App.Settings.ApiEndpoints.ACTION_GET_LIST, {});
```

You can also have placeholders in routs.

```
    http://api_url/action/{id}
```


#### Validator

`Validator` is a wrapper around the jQuery validator library for front end validations as well as a common interface to 
render validation errors thrown by the API.


### Creating Modules

A module is the combination of UI and it's driving logic attached together.

All modules of `Magnetar` resides in the `modules` directory. You **CANNOT** have sub directories in here.
So you have to name these module files in a logical manner of your choosing.

When you name module files use only lowercase letters and underscores. The name of the module file is the route that
`Router` uses to load it when it is called through its route. The extension of the file should be `.html`

The layout of the module file should be as follows

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

<script>

    App.Modules.Action = (function()
    {
        // ...
        // Module specific logic 
        // ...
        
        
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

The `init()` and `destroy()` methods must be in the module.
As soon as a module is loaded `App.Router` executes its `init()` method and
it executes the modules `destroy()` method just before it unloads the module.

The naming convention of the module object is also important.
Module class name should be the `Pascal Case` version of the file name without underscores.
And it should be namespaced as `App.Modules`

> ex: `App.Modules.ModuleName`

Following table shows how routs, files and module class should be named for different modules.

Route | Module File | Module Class
--- | --- | ---
`#action` | `action.html` | `App.Modules.Action`
`#another_action` | `another_action.html` | `App.Modules.AnotherAction`
`#much_complex_action` | `much_complex_action.html` | `App.Modules.MuchComplexAction`


### How to Combine Everything Together

So how to combine all these together and write a module?

Find a walkthrough of creating a `module` [here](walkthrough.md)
