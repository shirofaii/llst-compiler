const compile = require('../../src/methodCompiler.js').compile

describe('llst method grammar', function() {
    var tryCompileMethod = function(text) { return () => {compile(text)} }
    
    it('method', function() {
        
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