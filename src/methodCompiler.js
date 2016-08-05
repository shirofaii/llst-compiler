'use strict'
const assert = require('assert');
const parser = require('../build/llst-method.js')
const _ = require('lodash')


class Node {
    constructor(ast, parent) {
        this.type = ast.type
        this.location = ast.location
        this.parent = parent
    }
    
    static fromAst(ast, parent) {
        switch(ast.type) {
            case 'return':
                return new ReturnNode(ast, parent)
            break;
            case 'send':
                return new SendNode(ast, parent)
            break;
            case 'primitive':
                return new PrimitiveNode(ast, parent)
            break;
            case 'assignment':
                return new AssignmentNode(ast, parent)
            break;
            case 'cascade':
                return new CascadeNode(ast, parent)
            break;
            case 'classReference':
                return new ClassNode(ast, parent)
            break;
            case 'block':
                return new BlockNode(ast, parent)
            break;

            case 'bool':
            case 'variable':
                return new VariableNode(ast, parent)
            break;
            
            case 'number':
                return new NumberNode(ast, parent)
            break;
            case 'string':
                return new StringNode(ast, parent)
            break;
            case 'symbol':
                return new SymbolNode(ast, parent)
            break;
            case 'literalArray':
                return new ArrayNode(ast, parent)
            break;
            
            default:
                throw {message: 'Unknown AST node type', name: 'UnknownASTNode'}
        }
    }
    
    get isLiteral() { return false };
    
    forEach(aBlock) {
        // call aBlock for each node in tree
        aBlock(this)
        if(!this.children) return
        
        this.children.forEach(x => x.forEach(aBlock))
    }
    filter(aBlock) {
        // call aBlock for each node in tree and return array of passed nodes
        var result = []
        this.forEach(x => { if(aBlock(x)) result.push(x) } )
        return result
    }
    map(aBlock) {
        // call aBlock for each node in tree and return array of block results
        var result = [aBlock(this)]
        this.forEach(x => result.push(aBlock(x)) )
        return result
    }
    flat() {
        // return tree as array
        var result = []
        this.forEach( x => result.push(x) )
        return result
    }
    path() {
        // return array of nodes from this node to the tree root
        if(!this.parent) return [this]
        
        var result = []
        var cursor = this
        while(cursor) {
            result.push(cursor)
            cursor = cursor.parent
        }
        return result
    }
    level() {
        return this.path().length
    }
    
    toString(info) {
        info = info ? ' ' + info : ''
        var result = _.times(this.level() - 1, _.constant('  ')).join('') + this.type + info + '\n'
        if(this.children) {
            result += this.children.map(x => x.toString()).join('')
        }
        return result
    }
}

class MethodNode extends Node {
    constructor(ast, source) {
        super(ast, null)
        assert(ast.arguments)
        assert(ast.body)
        this.arguments = ast.arguments
        this.temps = ast.body.temps
        this.name = ast.name
        this.statements = ast.body.statements.map(x => Node.fromAst(x, this))
        this.source = source
    }
    
    get children() { return this.statements };
    
    toString() {
        return super.toString('#' + this.name)
    }
}

class SendNode extends Node {
    constructor(ast, parent) {
        super(ast, parent)
        assert(ast.receiver)
        assert(ast.selector)
        this.receiver = Node.fromAst(ast.receiver, this)
        this.selector = ast.selector
        this.arguments = ast.arguments || []
        this.arguments = this.arguments.map(x => Node.fromAst(x, this))
    }
    
    get children() { return _.concat(this.receiver, this.arguments) };
    
    toString() {
        return super.toString('#' + this.selector)
    }
}

class ReturnNode extends Node {
    constructor(ast, parent) {
        super(ast, parent)
        assert(ast.value)
        this.value = Node.fromAst(ast.value, this)
    }
    get children() { return [this.value] };
}

class AssignmentNode extends Node {
    constructor(ast, parent) {
        super(ast, parent)
        assert(ast.left)
        assert(ast.right)
        this.left = Node.fromAst(ast.left, this)
        this.right = Node.fromAst(ast.right, this)
    }
    get children() { return [this.left, this.right] };
}


class VariableNode extends Node {
    constructor(ast, parent) {
        super(ast, parent)
        assert(ast.value)
        this.name = ast.value
    }
    
    toString() {
        return super.toString(this.name)
    }
}
class ClassNode extends Node {
    constructor(ast, parent) {
        super(ast, parent)
        assert(ast.value)
        this.name = ast.value
    }
    
    toString() {
        return super.toString(this.name)
    }
}

class CascadeNode extends Node {
    constructor(ast, parent) {
        super(ast, parent)
        assert(ast.receiver)
        assert(ast.messages)
        
        this.receiver = Node.fromAst(ast.receiver, this)
        this.messages = ast.messages.map((x) => {return {
            selector: x.selector,
            arguments: x.arguments || []
        }})
        this.messages.forEach(s => s.arguments = s.arguments.map(x => Node.fromAst(x, this)))
    }
    
    get children() { return this.messages };
}

class BlockNode extends Node {
    constructor(ast, parent) {
        super(ast, parent)
        assert(ast.arguments)
        assert(ast.body)
        this.arguments = ast.arguments
        this.temps = ast.body.temps
        this.statements = ast.body.statements.map(stat => Node.fromAst(stat, this))
    }
    
    get isLiteral() { return true };
    get children() { return this.statements };
}


class LiteralNode extends Node {
    get isLiteral() { return true };
}

class NumberNode extends LiteralNode {
    constructor(ast, parent) {
        super(ast, parent)
        this.value = ast.value
    }
    
    toString() {
        return super.toString(this.value.toString())
    }
}

class StringNode extends LiteralNode {
    constructor(ast, parent) {
        super(ast, parent)
        assert(ast.value)
        this.value = ast.value
    }
    
    toString() {
        return super.toString('\'' + this.value + '\'')
    }
}
class SymbolNode extends LiteralNode {
    constructor(ast, parent) {
        super(ast, parent)
        assert(ast.value)
        this.value = ast.value
    }
    
    toString() {
        return super.toString('#' + this.value)
    }
}

class ArrayNode extends LiteralNode {
    constructor(ast, parent) {
        super(ast, parent)
        assert(ast.value)
        this.nodes = ast.value.map(x => Node.fromAst(x, this))
    }
    
    get children() { return this.nodes };
}

class SyntaxError extends Error {
    constructor(msg, node, info) {
        super(msg, 'SyntaxError')
        this.location = node.location
        this.node = node
        this.info = info
    }
}

// represnt encoding ast into compiledMethod
class MethodEncoder {
    constructor(methodNode) {
        this.methodNode = methodNode
        
        this.temps = []
        this.insts = []
        this.literals = []
        this.classes = []
        this.codes = []
        
        this.encode()
    }
    
    encode() {
        this.readVars()
        
    }
    
    readVars() {
        _.concat(this.methodNode.arguments, this.methodNode.temps).forEach(x => {
             if(_.includes(this.temps, x)) {
                 this.syntaxError('Variable with name "' + x + '" already defined', this.methodNode, x)
             }
             this.temps.push(x)
        })
        //TODO check limits
        //TODO add insts
    }
    
    syntaxError(msg, node, info) {
        throw new SyntaxError(msg, node, info)
    }
}

function parse(methodSource) {
    var root = parser.parse(methodSource)
    return new MethodNode(root, methodSource)
}

function compile(methodSource) {
    var encoder = new MethodEncoder(parse(methodSource))
    return encoder
}

module.exports = {compile, parse, SyntaxError}