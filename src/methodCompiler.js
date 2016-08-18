'use strict'
const assert = require('assert');
const parser = require('../build/llst-method.js')
const _ = require('lodash')

const psedoVariables = ['self', 'super', 'true', 'false', 'nil']

// special inlined selectors
const ifSelectors = ['ifTrue:', 'ifFalse:', 'ifTrue:ifFalse:', 'ifFalse:ifTrue:']
const whileSelectors = ['whileTrue:', 'whileFalse:']

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
    
    compile(encoder) {
        if(_.includes(ifSelectors, this.selector) && _.every(this.arguments, a => a.type === 'block')) {
            return this.optimizeIf(encoder)
        }
        if(_.includes(whileSelectors, this.selector) && this.arguments[0].type === 'block' && this.receiver.type === 'block') {
            return this.optimizeWhile(encoder)
        }
        
        this.receiver.compile(encoder)
        this.arguments.forEach(a => a.compile(encoder))
        if(this.receiver.type === 'variable' && this.receiver.name === 'super') {
            encoder.sendMessageToSuper(this.selector)
        } else {
            encoder.send(this.arguments.length, this.selector)
        }
    }
    
    optimizeWhile(encoder) {
        const conditionBlock = this.blockFromNode(encoder, this.receiver)
        const bodyBlock = this.blockFromNode(encoder, this.arguments[0])
        bodyBlock.popTop() // discard last instruction result before jump to condition block
        
        const condition = this.selector === 'whileTrue:'
        
        // 1 condition block
        // 2 jump behind body block + jump (5)
        // 3 body block
        // 4 jump to condition (1)
        // 5 push nil
        encoder.writeArray(conditionBlock.bytecode)
        this.jump(encoder, bodyBlock.bytecode.length + 2, !condition)
        encoder.writeArray(bodyBlock.bytecode)
        
        // condition block size
        // jump size
        // body size
        // jump size
        this.jump(encoder, -(2 + bodyBlock.bytecode.length + 2 + conditionBlock.bytecode.length))
        encoder.pushConstant(null)
    }
    
    optimizeIf(encoder) {
        this.receiver.compile(encoder)
        if(this.selector === 'ifTrue:') {
            // 1 jump behind block+jump (4)
            // 2 block
            // 3 jump behind block (5)
            // 4 push nil
            // 5 ...
            var block = this.blockFromNode(encoder, this.arguments[0])
            this.jump(encoder, block.bytecode.length + 2, false)
            encoder.writeArray(block.bytecode)
            this.jump(encoder, 1)
            encoder.pushConstant(null)
        }
        if(this.selector === 'ifFalse:') {
            var block = this.blockFromNode(encoder, this.arguments[0])
            this.jump(encoder, block.bytecode.length + 2, true)
            encoder.writeArray(block.bytecode)
            this.jump(encoder, 1)
            encoder.pushConstant(null)
        }
        if(this.selector === 'ifTrue:ifFalse:') {
            var blockA = this.blockFromNode(encoder, this.arguments[0])
            var blockB = this.blockFromNode(encoder, this.arguments[1])
            // 1 jump behind blockA+jump (4)
            // 2 blockA
            // 3 jump behind blockB (5)
            // 4 blockB
            // 5 ...
            this.jump(encoder, blockA.bytecode.length + 2, false)
            encoder.writeArray(blockA.bytecode)
            this.jump(encoder, blockB.bytecode.length)
            encoder.writeArray(blockB.bytecode)
        }
        if(this.selector === 'ifFalse:ifTrue:') {
            var blockA = this.blockFromNode(encoder, this.arguments[0])
            var blockB = this.blockFromNode(encoder, this.arguments[1])
            this.jump(encoder, blockA.bytecode.length + 2, true)
            encoder.writeArray(blockA.bytecode)
            this.jump(encoder, blockB.bytecode.length)
            encoder.writeArray(blockB.bytecode)
        }
    }
    
    blockFromNode(encoder, node) {
        var blockEncoder = new BlockEncoder(node, encoder, {inline: true})
        blockEncoder.encode()
        return blockEncoder
    }
    
    jump(encoder, offset, branchCondition) {
        offset = offset || 0
        
        if(branchCondition === true) {
            encoder.branchIfTrue(offset)
        }
        if(branchCondition === false) {
            encoder.branchIfFalse(offset)
        }
        if(branchCondition === undefined) {
            encoder.branch(offset)
        }
    }
}

class PrimitiveNode extends Node {
    constructor(ast, parent) {
        super(ast, parent)
        assert(ast.code)
        assert(ast.arguments)
        this.code = ast.code
        this.arguments = ast.arguments.map(x => Node.fromAst(x))
    }
    
    get children() { return this.arguments };
    
    toString() {
        return super.toString(this.code)
    }
    
    compile(encoder) {
        this.arguments.forEach(a => a.compile(encoder))
        encoder.primitive(this.code, this.arguments)
    }
}

class ReturnNode extends Node {
    constructor(ast, parent) {
        super(ast, parent)
        assert(ast.value)
        this.value = Node.fromAst(ast.value, this)
    }
    get children() { return [this.value] };
    
    compile(encoder) {
        if(this.value.type === 'variable' && this.value.name === 'self') {
            return encoder.selfReturnFromMethod()
        }
        this.value.compile(encoder)
        // have an experssion result on top of the stack
        return encoder.stackTopReturnFromMethod()
    }
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
    
    compile(encoder) {
        if(_.includes(psedoVariables, this.left.name)) {
            encoder.syntaxError('Cannot assign value to pseudo variable', this.left)
        }
        if(_.includes(encoder.arguments, this.left.name)) {
            encoder.syntaxError('Cannot assign value to argument', this.left)
        }
        this.left.check(encoder)
        this.right.compile(encoder)
        // now have an expression result on top of the stack
        this.left.assign(encoder)
    }
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

    check(encoder) {
        if(this.isTemp(encoder) || this.isInstance(encoder)) return;
        
        encoder.syntaxError('Unknown variable ' + this.name, this, this.name)
    }
    
    isArgument(encoder) {
        return _.includes(encoder.arguments, this.name)
    }
    isInstance(encoder) {
        return _.includes(encoder.insts, this.name)
    }
    isTemp(encoder) {
        return _.includes(encoder.temps, this.name)
    }
    
    assign(encoder) {
        if(this.isInstance(encoder)) {
            return encoder.assignInstance(this.index(encoder))
        }
        if(this.isTemp(encoder)) {
            return encoder.assignTemporary(this.index(encoder))
        }
    }
    index(encoder) {
        if(this.isArgument(encoder)) {
            return _.indexOf(encoder.arguments, this.name) + 1 // first argument always self
        }
        if(this.isInstance(encoder)) {
            return _.indexOf(encoder.insts, this.name)
        }
        if(this.isTemp(encoder)) {
            return _.indexOf(encoder.temps, this.name)
        }
    }
    
    compile(encoder) {
        if(this.name === 'self') return encoder.pushSelf()
        if(this.name === 'super') return encoder.pushSelf()
        if(this.name === 'true') return encoder.pushConstant(true)
        if(this.name === 'false') return encoder.pushConstant(false)
        if(this.name === 'nil') return encoder.pushConstant(null)
        
        if(this.isInstance(encoder)) return encoder.pushInstance(this.index(encoder))
        if(this.isArgument(encoder)) return encoder.pushArgument(this.index(encoder))
        if(this.isTemp(encoder)) return encoder.pushTemp(this.index(encoder))
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
    
    compile(encoder) {
        encoder.pushLiteralValue(this)
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
    
    get children() { return _.concat(this.receiver, this.messages) };
    
    compile(encoder) {
        this.receiver.compile(encoder)
        
        var send = (m) => {
            m.arguments.forEach(a => a.compile(encoder))
            if(this.receiver.type === 'variable' && this.receiver.name === 'super') {
                encoder.sendMessageToSuper(m.selector)
            } else {
                encoder.send(m.arguments.length, m.selector)
            }
        }
        
        this.messages.forEach((m, i) => {
            if(i === this.messages.length - 1) {
                // last message of cascade is just a simple sending
                return send(m)
            }
            
            encoder.duplicate() // same receiver each time
            send(m)
            encoder.popTop() //discard unused result
        })
    }
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
    
    get children() { return this.statements };
    
    compile(encoder) {
        var blockEncoder = new BlockEncoder(this, encoder)
        blockEncoder.encode()
        
        encoder.pushBlock(this.arguments.length, blockEncoder.localsOffset, blockEncoder.bytecode.length)
        encoder.writeArray(blockEncoder.bytecode)
    }
    
    compileInline(encoder) {
        var blockEncoder = new BlockEncoder(this, encoder, {inline: true})
        blockEncoder.encode()
        encoder.maxStackSize = Math.max(encoder.maxStackSize, blockEncoder.maxStackSize)
        encoder.writeArray(blockEncoder.bytecode)
        return blockEncoder
    }
}


class LiteralNode extends Node {
    compile(encoder) {
        return encoder.pushLiteralValue(this)
    }
}

class NumberNode extends LiteralNode {
    constructor(ast, parent) {
        super(ast, parent)
        this.value = ast.value
    }
    
    toString() {
        return super.toString(this.value.toString())
    }
    
    compile(encoder) {
        if(Number.isInteger(this.value) && this.value >= 0 && this.value <= 9) {
            return encoder.pushConstant(this.value)
        }
        super.compile(encoder)
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
        assert(ast.nodes)
        this.nodes = ast.nodes.map(x => Node.fromAst(x, this))
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

class Encoder {
    constructor() {
        this.stackSize = 0
        this.maxStackSize = 0
    }
    
    // calculate max stack size, called for each push-something instruction
    stackPush(numValues) {
        this.stackSize += numValues
        this.maxStackSize = Math.max(this.maxStackSize, this.stackSize)
    }
    // calculate max stack size, called for each instruction which pop values from a stack
    stackPop(numValues) {
        this.stackSize -= numValues
        assert(this.stackSize >= 0)
    }
    
    syntaxError(msg, node, info) {
        throw new SyntaxError(msg, node, info)
    }
    
    // opcodes generation
    opcode(high, low) {
        if(low >= 16) {
            this.opcode(0, high)
            this.writeByte(low)
        } else {
            this.writeByte(high * 16 + low)
        }
    }
    writeByte(byte) {
        assert(byte <= 255 && byte >= 0)
        this.bytecode.push(byte)
    }
    writeBytecodeOffset(offset) {
        this.bytecode.push({offset})
    }
    writeArray(array) {
        this.bytecode = _.concat(this.bytecode, array)
    }
    // push
    pushInstance(idx) {
        this.stackPush(1)
        this.opcode(1, idx)
    }
    pushArgument(idx) {
        this.stackPush(1)
        this.opcode(2, idx)
    }
    pushTemp(idx) {
        this.stackPush(1)
        this.opcode(3, idx)
    }
    pushLiteral(idx) {
        this.stackPush(1)
        this.opcode(4, idx)
    }
    pushConstant(value) {
        this.stackPush(1)
        switch (value) {
            case 0: return this.opcode(5, 0)
            case 1: return this.opcode(5, 1)
            case 2: return this.opcode(5, 2)
            case 3: return this.opcode(5, 3)
            case 4: return this.opcode(5, 4)
            case 5: return this.opcode(5, 5)
            case 6: return this.opcode(5, 6)
            case 7: return this.opcode(5, 7)
            case 8: return this.opcode(5, 8)
            case 9: return this.opcode(5, 9)
            case null: return this.opcode(5, 10)
            case true: return this.opcode(5, 11)
            case false: return this.opcode(5, 12)
            default: assert('wrong constant value: ' + value)
        }
    }
    pushBlock(argSize, argOffset, bytecodeSize) {
        this.stackPush(1)
        this.opcode(12, argSize)
        if(argSize > 0) {
            this.writeByte(argOffset)
        }
        this.writeByte(bytecodeSize)
    }
    pushSelf() {
        this.pushArgument(0)
    }
    pushNil() {
        this.pushConstant(null)
    }
    pushTrue() {
        this.pushConstant(true)
    }
    pushFalse() {
        this.pushConstant(false)
    }
    // assignment
    assignInstance(idx) {
        this.opcode(6, idx)
    }
    assignTemporary(idx) {
        this.opcode(7, idx)
    }
    // return
    selfReturn() {
        this.opcode(15, 1)
    }
    stackReturn() {
        this.opcode(15, 2)
    }
    blockReturn() {
        this.opcode(15, 3)
    }
    // sends
    sendMessageOpcode(argSize, selectorIndex) {
        this.stackPop(argSize + 1)
        this.stackPush(1)
        this.opcode(9, argSize)
        this.writeByte(selectorIndex)
    }
    markArguments(size) {
        this.opcode(8, size)
    }
    //pop
    popTop() {
        this.stackPop(1)
        this.opcode(15, 5)
    }
    duplicate() {
        this.stackPush(1)
        this.opcode(15, 4)
    }
    primitive(code, args) {
        this.stackPop(args.length)
        this.stackPush(1)
        this.opcode(13, code)
    }
    //branches
    branch(instructionPosition) {
        this.opcode(15, 6)
        this.writeBytecodeOffset(instructionPosition)
    }
    branchIfTrue(instructionPosition) {
        this.opcode(15, 7)
        this.writeBytecodeOffset(instructionPosition)
    }
    branchIfFalse(instructionPosition) {
        this.opcode(15, 8)
        this.writeBytecodeOffset(instructionPosition)
    }
    // helpers
    pushLiteralValue(value) {
        // push nodes to literals array, will be converted to objects on image generating phase
        this.literals.push(value)
        this.pushLiteral(this.literals.length - 1)
    }
    literalIndexForSelector(selector) {
        var idx = _.indexOf(this.literals, selector)
        if(idx === -1) {
            this.literals.push(selector)
            return this.literals.length - 1
        } else {
            return idx
        }
    }
    send(size, selector) {
        this.markArguments(size + 1) // add receiver to arguments count
        this.sendMessageOpcode(size, this.literalIndexForSelector(selector))
    }
    sendMessageToSuper(selector) {
        this.opcode(15, 11)
        this.writeByte(this.literalIndexForSelector(selector))
    }
}

// encoding ast into compiledMethod
class MethodEncoder extends Encoder {
    constructor(methodNode, klass) {
        super()
        
        // both parameters are optional
        this.methodNode = methodNode
        this.klass = klass
        
        this.name = methodNode ? methodNode.name : ''
        this.arguments = []
        this.temps = []
        this.insts = this.klassVariables()
        this.literals = []
        this.bytecode = []
    }
    
    encode() {
        this.readArgs()
        this.readTemps()
        this.methodNode.children.forEach(st => {
            st.compile(this)
            // drop or return top value on stack (result) for each instructon
            if(st.type !== 'return') this.popTop()
        })
        if(_.last(this.methodNode.children).type !== 'return') {
            this.selfReturn()
        }
        this.fixOffsets()
        return this
    }
    
    readArgs() {
        if(this.methodNode.arguments.length > 255) {
            this.syntaxError('Too many arguments', this.methodNode)
        }
        
        this.methodNode.arguments.forEach(x => {
             if(_.includes(this.arguments, x)) {
                 this.syntaxError('Argument with name "' + x + '" already defined', this.methodNode, x)
             }
             this.arguments.push(x)
        })
    }
    
    readTemps() {
        if(this.methodNode.temps.length > 256) {
            this.syntaxError('Too many variables', this.methodNode)
        }
        
        this.methodNode.temps.forEach(x => {
             if(_.includes(this.arguments, x) || _.includes(this.temps, x)) {
                 this.syntaxError('Variable with name "' + x + '" already defined', this.methodNode, x)
             }
             this.temps.push(x)
        })
    }
    
    selfReturnFromMethod() {
        this.selfReturn()
    }
    
    stackTopReturnFromMethod() {
        this.stackReturn()
    }
    
    // convert bytecode jump offsets to absolute values
    fixOffsets() {
        for(var i = 0; i < this.bytecode.length; i++) {
            if(typeof this.bytecode[i].offset === 'number') {
                assert(this.bytecode[i].offset !== 0)
                var absPos = i + this.bytecode[i].offset + 1
                if(absPos > 255 || absPos < 0) {
                    this.syntaxError('Too big method', this, this.bytecode.length)
                }
                this.bytecode[i] = absPos
            }
        }
    }
    
    klassVariables() {
        if(!this.klass) return []
        
        return this.klass.allVariables()
    }
}

class BlockEncoder extends Encoder {
    constructor(blockNode, parent, options) {
        super()
        this.parent = parent
        this.blockNode = blockNode
        this.options = options || {
            inline: false // inline mode: encoding inlined code for branches
        }
        
        // find method encoder
        var cursor = this
        while(cursor.parent) { cursor = cursor.parent }
        this.methodEncoder = cursor
        
        this.bytecode = []
        this.locals = [] // arguments and temps which local for this block
        
        if(this.options.inline) {
            this.stackSize = parent.stackSize
            this.maxStackSize = parent.maxStackSize
        }
    }
    
    get literals() { return this.methodEncoder.literals };
    get arguments() { return this.methodEncoder.arguments };
    get insts() { return this.methodEncoder.insts };
    
    get localsOffset() { return this.parent.temps.length }; // offset for this array in method context
    
    readTemps() {
        this.temps = _.clone(this.parent.temps)
        this.locals = _.concat(this.blockNode.arguments, this.blockNode.temps)
        this.locals.forEach(x => {
             if(_.includes(this.temps, x)) {
                 this.syntaxError('Variable with name "' + x + '" already defined', this.blockNode, x)
             }
             this.temps.push(x)
        })
        if(this.temps.length >= 255) {
            this.syntaxError('Too many variables', this.blockNode)
        }
    }
    
    encode() {
        this.readTemps()
        this.blockNode.children.forEach((st, i) => {
            var lastInstruction = i === this.blockNode.children.length - 1
            st.compile(this)
            // drop or return top value on stack (result) for each instructon
            // except last one
            if(st.type !== 'return') {
                if(lastInstruction) {
                    if(!this.options.inline) this.stackReturn()
                } else {
                    this.popTop()
                }
            }
        })
        if(this.bytecode.length > 256) {
            this.syntaxError('Block bytecode limited to 256 bytes', this.blockNode, bytecode.length)
        }
        return this
    }
    
    selfReturnFromMethod() {
        if(this.options.inline) {
            this.selfReturn()
        } else {
            this.pushSelf()
            this.blockReturn()
        }
    }
    
    stackTopReturnFromMethod() {
        if(this.options.inline) {
            this.stackReturn()
        } else {
            this.blockReturn()
        }
    }
}

function parse(methodSource) {
    var root = parser.parse(methodSource)
    return new MethodNode(root, methodSource)
}

// klass may be null if method would be compiled outside of a class context
function compile(methodSource, klass) {
    var encoder = new MethodEncoder(parse(methodSource), klass)
    return encoder.encode()
}

module.exports = {compile, parse, SyntaxError, MethodEncoder, BlockEncoder}