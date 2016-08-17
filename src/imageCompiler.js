'use strict'
const assert = require('assert');
const parser = require('../build/llst-image.js')
const methodCompiler = require('./methodCompiler.js')
const _ = require('lodash')

function compile(imageSource) {
    var nodes = parser.parse(imageSource)
    var encoder = new ImageEncoder(nodes)
    return encoder.encode()
}

class Class {
    constructor(encoder, node, raw) {
        this.name = node.name
        this.parentClass = encoder.findClass(node.subclassOf)
        if(!this.parentClass && node.subclassOf !== null) {
            encoder.syntaxError('Cannot find class ' + node.subclassOf, node, node.subclassOf)
        }
        
        this.readMetaClass(encoder, node, raw)
        
        this.methods = {}
        this.variables = node.variables
        this.children = []
        
        this.size = this.variables.length + (this.parentClass ? this.parentClass.size : 0)
    }
    
    readMetaClass(encoder, node, raw) {
        if(raw) {
            this.metaClass = encoder.findClass(node.instanceOf)
        } else {
            this.metaClass = encoder.newMetaClass(node)
        }
        
        if(!this.metaClass) {
            console.log(node)
            encoder.syntaxError('Cannot find class ' + node.instanceOf, node, node.instanceOf)
        }
    }
    
    addSubclass(klass) {
        
    }
}

class ImageEncoder {
    constructor(nodes) {
        this.nodes = nodes
        this.classes = {}
    }
    
    encode() {
        this.scanClasses()
        // some classes have circular links to each other, so we read classes in two steps
        this.scanClasses()
        this.compileMethods()
        
        return this
    }
    
    scanClasses() {
        this.nodes.forEach(x => {
            var raw = x.type === 'rawclass'
            if(x.type === 'class' || raw) {
                if(!this.classes[x.name]) {
                    this.classes[x.name] = new Class(this, x, raw)
                } else {
                    this.classes[x.name].readMetaClass(this, x, raw)
                }
            }
        })
    }
    
    newMetaClass(node) {
        var metaNode = {
            type: 'rawclass',
            name: 'Meta' + node.name,
            instanceOf: 'Class',
            subclassOf: 'Meta' + node.subclassOf,
            variables: []
        }
        this.classes[metaNode.name] = new Class(this, metaNode, true)
        return this.classes[metaNode.name]
    }
    
    findClass(name) {
        if(name === null) {
            return null
        }
        var found = _.find(this.classes, x => x.name === name)
        if(found) {
            return found
        }
        
        // have possible cycled link there, so we write actual class later
        // now just mark it with name
        found = _.find(this.nodes, x => x.name === name)
        if(found) {
            return name
        }
        return null
    }
    
    compileMethods() {
        this.nodes.forEach(x => {
            if(x.type === 'method') {
                var klass = this.classes[x.className]
                if(!klass) {
                    this.syntaxError('Unknown class ' + x.className, x, x.className)
                }
                var encodedMethod = methodCompiler.compile(x.source)
                klass.methods[encodedMethod.name] = encodedMethod
            }
        })
    }
    
    syntaxError(msg, node, info) {
        throw new methodCompiler.SyntaxError(msg, node, info)
    }
}


module.exports = {compile, ImageEncoder, SyntaxError: methodCompiler.SyntaxError}