'use strict'
const assert = require('assert');
const parser = require('./llst.js')

function parse(methodSource) {
    var root = parser.parse(methodSource)
    return new MethodNode(root)
}

class Node {
    constructor(ast) {
        this.ast = ast
    }
    
    static fromAst(ast) {
        assert(ast)
        assert(ast.type)
        
        switch(ast.type) {
            case 'return':
                return new ReturnNode(ast)
            break;
            case 'send':
                return new SendNode(ast)
            break;
            case 'primitive':
                return new PrimitiveNode(ast)
            break;
            case 'assignment':
                return new AssignmentNode(ast)
            break;
            case 'cascade':
                return new CascadeNode(ast)
            break;
            case 'classReference':
                return new ClassNode(ast)
            break;
            case 'block':
                return new BlockNode(ast)
            break;

            case 'bool':
            case 'variable':
                return new VariableNode(ast)
            break;
            
            case 'number':
                return new NumberNode(ast)
            break;
            case 'string':
                return new StringNode(ast)
            break;
            case 'symbol':
                return new SymbolNode(ast)
            break;
            case 'literalArray':
                return new ArrayNode(ast)
            break;
            
            default:
                throw {message: 'Unknown AST node type', name: 'UnknownASTNode'}
        }
    }
}

class MethodNode extends Node {
    constructor(ast) {
        super(ast)
        assert(ast.type === 'method')
        assert(ast.arguments)
        assert(ast.body)
        this.params = ast.arguments
        this.temps = ast.body.temps
        this.nodes = ast.body.statements
            .map(stat => Node.fromAst(stat))
            .filter(x => x.canGenerateBytecode())
    }
    
    canGenerateBytecode() {return true}
}

class SendNode extends Node {
    constructor(ast) {
        super(ast)
        assert(ast.receiver)
        assert(ast.selector)
        this.receiver = Node.fromAst(ast.receiver)
        this.selector = ast.selector
        this.arguments = ast.arguments || []
        this.arguments = this.arguments.map(x => Node.fromAst(x))
    }
    
    
    canGenerateBytecode() {return true}
}

class ReturnNode extends Node {
    constructor(ast) {
        super(ast)
        assert(ast.value)
        this.value = Node.fromAst(ast.value)
    }
    
    canGenerateBytecode() {return true}
}

class AssignmentNode extends Node {
    constructor(ast) {
        super(ast)
        assert(ast.left)
        assert(ast.right)
        this.left = Node.fromAst(ast.left)
        this.right = Node.fromAst(ast.right)
    }

    canGenerateBytecode() {return true}
}


class VariableNode extends Node {
    constructor(ast) {
        super(ast)
        assert(ast.value)
        this.name = ast.value
    }
    
    canGenerateBytecode() {return false}
}
class ClassNode extends Node {
    constructor(ast) {
        super(ast)
        assert(ast.value)
        this.name = ast.value
    }

    canGenerateBytecode() {return false}
}

class CascadeNode extends Node {
    constructor(ast) {
        super(ast)
        assert(ast.receiver)
        assert(ast.nodes)
        
        this.receiver = Node.fromAst(ast.receiver)
        this.sends = ast.nodes.map((x) => {return {
            selector: x.selector,
            arguments: x.arguments || []
        }})
        this.sends.forEach(s => s.arguments = s.arguments.map(x => Node.fromAst(x)))
    }

    canGenerateBytecode() {return true}
}

class BlockNode extends Node {
    constructor(ast) {
        super(ast)
        assert(ast.params)
        assert(ast.body)
        this.params = ast.params
        this.temps = ast.body.temps
        this.nodes = ast.body.statements.map(stat => Node.fromAst(stat))
    }
    
    canGenerateBytecode() {return false}
}


class LiteralNode extends Node {
    canGenerateBytecode() {return false}
}

class NumberNode extends LiteralNode {
    constructor(ast) {
        super(ast)
        assert(ast.value)
        this.value = ast.value
    }
}

class StringNode extends LiteralNode {
    constructor(ast) {
        super(ast)
        assert(ast.value)
        this.value = ast.value
    }
}
class SymbolNode extends LiteralNode {
    constructor(ast) {
        super(ast)
        assert(ast.value)
        this.value = ast.value
    }
}
class ArrayNode extends LiteralNode {
    constructor(ast) {
        super(ast)
        assert(ast.value)
        this.nodes = ast.value.map(x => Node.fromAst(x))
    }
}


var ast = parse(`
test
    [ 12 t ] value.
`)

console.log(ast)