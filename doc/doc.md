# Magnetar Documentation

### Table of Content

1. [Introduction](#introduction)
2. [Folder Structure](#folder-structure)
3. [Libraries](#libraries)
4. [Core](#core)
5. [Index File](#index-file)
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
        |- core
        |    |- app.js
        |- doc
        |    |- doc.md
        |- lib
        |    |- css
        |        |- (required css files)
        |    |- fonts
        |        |- (required web fonts)
        |    |- js
        |        |- jquery
        |        |- jwt
        |        |- notify
        |        |- validator
        |        |- (other js libraries you need)   
        |- modules
        |    |- (modules that you create)
        |
        |- .gitignore
        |- favicon.ico
        |- index.html
        |- README.md
