'use strict'

module.exports = {
    options: {
        sourceMap: false,
        presets: ['es2015']
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