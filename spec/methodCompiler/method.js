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
        expect(method.maxStackSize).toEqual(1)
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
        
        expect(method.maxStackSize).toEqual(1)
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
        expect(method.maxStackSize).toEqual(1)
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
        
        expect(method.maxStackSize).toEqual(2)
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
        
        expect(method.maxStackSize).toEqual(2)
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
        
        expect(method.maxStackSize).toEqual(1)
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
        
        expect(method.maxStackSize).toEqual(1)
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
        
        expect(method.maxStackSize).toEqual(1)
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
        
        expect(method.maxStackSize).toEqual(2)
        expect(method.bytecode).toEqual(enc.bytecode)
    })
    it('method', function() {
        var method = compile(`
            test
            ^<1 'a'>
        `)
        var enc = new MethodEncoder()
        
        enc.pushLiteralValue('a')
        enc.primitive(1, ['a'])
        enc.stackReturn()
        
        expect(method.maxStackSize).toEqual(1)
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
        
        expect(method.maxStackSize).toEqual(1)
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
        
        enc.fixOffsets()
        expect(method.bytecode).toEqual(enc.bytecode)
    })
    it('method', function() {
        var method = compile(`
            test |x|
            x <- 3 > 4 ifTrue: [ 3 ].
        `)
        var enc = new MethodEncoder()
        
        enc.pushConstant(3)
        enc.pushConstant(4)
        enc.send(1, '>')
        enc.branchIfFalse(3)
            enc.pushConstant(3)     // size 1 byte
        enc.branch(1)               // size 2 bytes
            enc.pushConstant(null)  // size 1 byte
        enc.assignTemporary(0)
        enc.popTop()
        enc.selfReturn()
        
        enc.fixOffsets()
        expect(method.bytecode).toEqual(enc.bytecode)
    })
    it('method', function() {
        var method = compile(`
            test
            ^true ifTrue: [false ifFalse: [self]]
        `)
        var enc = new MethodEncoder()
        
        enc.pushConstant(true)
        enc.branchIfFalse(9)
            enc.pushConstant(false)         // size 1 byte
            enc.branchIfTrue(3)             // size 2 bytes
                enc.pushSelf()              // size 1 byte
            enc.branch(1)                   // size 2 bytes
                enc.pushConstant(null)      // size 1 byte
        enc.branch(1)                       // size 2 bytes
            enc.pushConstant(null)          // size 1 byte
        enc.stackReturn()
        
        enc.fixOffsets()
        expect(method.bytecode).toEqual(enc.bytecode)
    })
    it('method', function() {
        var method = compile(`
            test
            ^[false] whileTrue: [true]
        `)
        var enc = new MethodEncoder()
        
        enc.pushConstant(false)             // size 1 byte
        enc.branchIfFalse(4)                // size 2 bytes
            enc.pushConstant(true)          // size 1 byte
            enc.popTop()                    // size 1 byte
        enc.branch(-7)                      // size 2 bytes
            enc.pushConstant(null)          // size 1 byte
        enc.stackReturn()
        
        enc.fixOffsets()
        expect(method.bytecode).toEqual(enc.bytecode)
    })
    it('method stack size', function() {
        var method = compile(`
            test
            ^[ 1 to: 10 by: 2 ]
        `)
        expect(method.maxStackSize).toEqual(3)
    })
    it('method stack size', function() {
        var method = compile(`
            test
            [true] whileTrue: [ 1 to: 10 by: 2 ]
        `)
        expect(method.maxStackSize).toEqual(3)
    })
    it('big method', function() {
        var method = compile(`
            run: rounds | mock array ordered indices list tree |
            mock <- Mock new.
        
            self run: [ 2 + 3 ] rounds: rounds text: 'Literal addition'.
            self run: [ 2 + (mock argReturn: 3) ] rounds: rounds text: 'SmallInt + object'.
            self run: [ (mock argReturn: 3) + 2] rounds: rounds text: 'object + SmallInt'.
        
            self run: [ 1 to: rounds do: [ :x | 2 + 3 ] ] rounds: 1 text: 'Literal addition in a loop'.
            self run: [ 1 to: rounds do: [ :x | 2 + (mock argReturn: 3) ] ] rounds: 1 text: 'SmallInt + object in a loop'.
            self run: [ 1 to: rounds do: [ :x | (mock argReturn: 3) + 2 ] ] rounds: 1 text: 'object + SmallInt in a loop'.
        
            self run: [ mock selfReturn ] rounds: rounds text: 'Self return'.
            self run: [ mock stackReturn ] rounds: rounds text: 'Stack return'.
            self run: [ mock argReturn: nil ] rounds: rounds text: 'Arg return'.
            self run: [ mock literalReturn ] rounds: rounds text: 'Literal return'.
            self run: [ mock fieldReturn ] rounds: rounds text: 'Field return'.
        
            self run: [ mock setField: nil ] rounds: rounds text: 'Set field'.
            self run: [ mock setTemporary: nil ] rounds: rounds text: 'Set temporary'.
        
            self run: [ 'Hello world' size ] rounds: rounds text: 'Literal receiver'.
        
            self run: [ mock selfSend ] rounds: rounds text: 'Self dispatch'.
        
            self run: [ mock invokeBlock: [nil] ] rounds: rounds text: 'Block invoke'.
            self run: [ mock blockReturn ] rounds: rounds text: 'Block return'.
        
            self run: [ mock selfReturn selfReturn selfReturn selfReturn selfReturn ] rounds: rounds text: 'Chain dispatch'.
            self run: [ mock selfReturn; selfReturn; selfReturn; selfReturn; selfReturn ] rounds: rounds text: 'Cascade dispatch'.
        
            self run: [ mock invokePrimitive ] rounds: rounds text: 'Primitive invocation'.
            self run: [ mock failPrimitive ] rounds: rounds text: 'Failed primitive invocation'.
        
            self run: [ mock invokeUnknownSelector ] rounds: rounds text: 'Dispatch of #doesNotUnderstand'.
        
            array <- Array new: 10000.
            indices <- Array new: 10000.
            1 to: array size do: [ :x | indices at: x put: (array size atRandom) ].
        
            self run: [ 1 to: array size do: [ :x | array at: x ] ] rounds: rounds / (array size) text: 'Array, linear read'.
            self run: [ 1 to: array size do: [ :x | array at: (indices at: x) ] ] rounds: rounds / (array size) text: 'Array, random read'.
        
            array <- Array new: 2.
            self softRun: [ array insert: nil at: array size / 2 ] rounds: rounds text: 'Array, middle insert'.
        
            array <- Array new: 2.
            self jitRun: [ array insert: nil at: array size / 2 ] rounds: rounds text: 'Array, middle insert'.
        
            ordered <- OrderedArray new: 0.
            self softRun: [ 1 to: (indices size) do: [ :x | ordered add: (indices at: x) ] ] rounds: rounds / (indices size) text: 'OrderedArray, creation'.
            self softRun: [ 1 to: (indices size) do: [ :x | ordered includes: (indices at: x) ] ] rounds: rounds / (indices size) text: 'OrderedArray, selection'.
        
            ordered <- OrderedArray new: 0.
            self jitRun: [ 1 to: (indices size) do: [ :x | ordered add: (indices at: x) ] ] rounds: rounds / (indices size) text: 'OrderedArray, creation'.
            self jitRun: [ 1 to: (indices size) do: [ :x | ordered includes: (indices at: x) ] ] rounds: rounds / (indices size) text: 'OrderedArray, selection'.
        
            list <- List new.
            self softRun: [ 1 to: rounds do: [ :x | list add: x ] ] rounds: 1 text: 'List front insert'.
        
            list <- List new.
            self jitRun: [ 1 to: rounds do: [ :x | list add: x ] ] rounds: 1 text: 'List front insert'.
        
            indices <- Array new: 10000.
            1 to: indices size do: [ :x | indices at: x put: (indices size atRandom) ].
        
            tree <- Tree new.
            self softRun: [ 1 to: indices size do: [ :x | tree add: (indices at: x) ] ] rounds: 1 text: 'Tree insert'.
        
            tree <- Tree new.
            self jitRun: [ 1 to: indices size do: [ :x | tree add: (indices at: x) ] ] rounds: 1 text: 'Tree insert'.
        
            self run: [ tree collect: [ :x | x * 2 ] ] rounds: 1 text: 'Tree collect'.
            `)
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