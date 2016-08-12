const compile = require('../../src/methodCompiler.js').compile
const MethodEncoder = require('../../src/methodCompiler.js').MethodEncoder

describe('llst method grammar', function() {
    var tryCompileMethod = function(text) { return () => {compile(text)} }
    
    it('method', function() {
        var method = compile(`
            test | x |
            x <- 2.
        `)
        expect(method.temps).toEqual(['x'])
        expect(method.literals).toEqual([])
        expect(method.bytecode).toEqual([82, 112, 245, 241])
    })

    it('method', function() {
        var method = compile(`
            test
            ^nil
        `)
        var enc = new MethodEncoder()
        
        enc.pushConstant(null)
        enc.stackReturn()
        
        expect(method.bytecode).toEqual(enc.bytecode)
    })
    it('method', function() {
        var method = compile(`
            test |x|
            x <- #(1 true #()).
            ^x.
        `)
        var enc = new MethodEncoder()
        
        enc.pushLiteralValue(/*array*/)
        enc.assignTemporary(0)
        enc.popTop()
        enc.pushTemp(0)
        enc.stackReturn()
        
        expect(method.bytecode).toEqual(enc.bytecode)
    })
    it('method', function() {
        var method = compile(`
            test |x|
            x <- 3 + 4.
            ^x factorial.
        `)
        var enc = new MethodEncoder()
        
        enc.pushConstant(3)
        enc.pushConstant(4)
        enc.send(1, '+')
        enc.assignTemporary(0)
        enc.popTop()
        enc.pushTemp(0)
        enc.send(0, 'factorial')
        enc.stackReturn()
        
        expect(method.bytecode).toEqual(enc.bytecode)
    })
    it('method', function() {
        var method = compile(`
            test: a
            ^a to: 10
        `)
        var enc = new MethodEncoder()
        
        enc.pushArgument(1)
        enc.pushLiteralValue(10)
        enc.send(1, 'to:')
        enc.stackReturn()
        
        expect(method.bytecode).toEqual(enc.bytecode)
    })
    it('method', function() {
        var method = compile(`
            test
            ^self isNumber not
        `)
        var enc = new MethodEncoder()
        
        enc.pushSelf()
        enc.send(0, 'isNumber')
        enc.send(0, 'not')
        enc.stackReturn()
        
        expect(method.bytecode).toEqual(enc.bytecode)
    })
    it('method', function() {
        var method = compile(`
            test
            super init.
            ^self init.
        `)
        var enc = new MethodEncoder()
        
        enc.pushSelf()
        enc.sendMessageToSuper('init')
        enc.popTop()
        enc.pushSelf()
        enc.send(0, 'init')
        enc.stackReturn()
        
        expect(method.bytecode).toEqual(enc.bytecode)
    })
    it('method', function() {
        var method = compile(`
            test
            ^super.
        `)
        var enc = new MethodEncoder()
        
        enc.pushSelf()
        enc.stackReturn()
        
        expect(method.bytecode).toEqual(enc.bytecode)
    })
    it('method', function() {
        var method = compile(`
            test
            self a;b;c.
        `)
        var enc = new MethodEncoder()
        
        enc.pushSelf()
        enc.duplicate()
        enc.send(0, 'a')
        enc.popTop()
        enc.duplicate()
        enc.send(0, 'b')
        enc.popTop()
        enc.send(0, 'c')
        enc.popTop()
        enc.selfReturn()
        
        expect(method.bytecode).toEqual(enc.bytecode)
    })
    it('method', function() {
        var method = compile(`
            test
            ^<1 'a'>
        `)
        var enc = new MethodEncoder()
        
        enc.pushLiteralValue('a')
        enc.primitive(1)
        enc.stackReturn()
        
        expect(method.bytecode).toEqual(enc.bytecode)
    })
    it('method', function() {
        var method = compile(`
            test
            ^[ ^self ]
        `)
        var enc = new MethodEncoder()
        
        enc.pushBlock(0, 0, 2)
            enc.pushSelf()
            enc.blockReturn()
        enc.stackReturn()
        
        expect(method.bytecode).toEqual(enc.bytecode)
    })
    it('method', function() {
        var method = compile(`
            test: a1 | a2 |
            [:b1| | b2 b3 b4 |
                [:c1| | c2 |
                    a1+b1+c1
                ] value: b1
            ] value: a1.
        `)
        var enc = new MethodEncoder()
        
        enc.pushBlock(1, 1, 18)
            enc.pushBlock(1, 5, 10)
                enc.pushArgument(1)
                enc.pushTemp(1)
                enc.send(1, '+')
                enc.pushTemp(5)
                enc.send(1, '+')
                enc.stackReturn()
            enc.pushTemp(1)
            enc.send(1, 'value:')
            enc.stackReturn()
        enc.pushArgument(1)
        enc.send(1, 'value:')
        enc.popTop()
        enc.selfReturn()
        
        expect(method.bytecode).toEqual(enc.bytecode)
    })
    it('method', function() {
        var method = compile(`
            test |x|
            x <- 3 > 4 ifTrue: [ 3 ] ifFalse: [ 4 ].
        `)
        var enc = new MethodEncoder()
        
        enc.pushConstant(3)
        enc.pushConstant(4)
        enc.send(1, '>')
        enc.branchIfFalse(3)
            enc.pushConstant(3) // size 1 byte
        enc.branch(1)           // size 2 bytes
            enc.pushConstant(4) // size 1 byte
        enc.assignTemporary(0)
        enc.popTop()
        enc.selfReturn()
        
        expect(method.bytecode).toEqual(enc.bytecode)
    })


    it('method error', function() {
        var method = `
            from: a to: b
            | a b c |
            
            ^nil
        `
        expect(tryCompileMethod(method)).toThrowError('Variable with name "a" already defined')
    });

});