# Magnetar Documentation

### Table of Content

1. [Introduction](#introduction)
2. [Folder Structure](#folder-structure)
3. [Libraries](#libraries)
4. [Index File](#index-file)
5. [Core](#core)
6. [Modules](#modules)


## Introduction

Magnetar is aimed at being a web client that can communicate to a web api.

The idea behind this project is to come up with a JavaScript framework that can be used out of the box for development.
Even without the need to set up a specialized environment using a javascript tool set.

Just the plain old JavaScript goodness!

The project will only give you the bare fundamentals. Nothing more than that. So you can decide on what and what not to add.
In most cases the framework will not interfere with your choices.

Magnetar provides following fundamentals that you need to kickstart your SPA project.

 - JWT support
 - Session support
 - PubSub to handle user defined events
 - Request to deal with communicating with the server (And yes! it can upload files)
 - Router to load and unload modules and to navigate around
 - Validator to validate forms
 - Additional Helper functions
 - Header, Side Navigation and Login module already in place

Enjoy!


## Folder Structure

    magnetar
        |- core/
        |    |- app.js
        |- doc/ (documentation)
        |    |- doc.md
        |- lib/ (libraries)
        |    |- css/
        |        |- bootsetap.css
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
Of these following libraries are essential for `Magnetar` to work.

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




## Modules