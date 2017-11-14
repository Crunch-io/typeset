'use strict'

module.exports = {
    options: {
        sourceMap: false,
        presets: ['env']
    },
    dist: {
        files: [{
            expand: true,
            src: ["src/*.js"],
            dest:'dist/',
            flatten: true
        }]
    }

}