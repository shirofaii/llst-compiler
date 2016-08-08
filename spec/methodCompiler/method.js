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

    it('method error', function() {
        var method = `
            from: a to: b
            | a b c |
            
            ^nil
        `
        expect(tryCompileMethod(method)).toThrowError('Variable with name "a" already defined')
    });

});