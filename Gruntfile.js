/* eslint-env node */
/* eslint no-process-env: "off" */

'use strict'

module.exports = function initGrunt(grunt) {
    const path = require('path')

    require('load-grunt-config')(grunt, {
        configPath: path.join(process.cwd(), 'grunt/config'),
        jitGrunt: {
            customTasksDir: 'grunt/tasks'
        },
        data: {
            pkg: '<%= package %>',
            widgetRoot: process.env.WIDGET_ROOT
        }
    })
}
