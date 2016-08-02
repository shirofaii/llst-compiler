const parser = require('../../build/llst-method.js')
const SyntaxError = parser.SyntaxError

function parse(rule, text) {
    return parser.parse(text, {startRule: rule})
}

describe('llst block grammar', function() {
    var parseBlock = text => parse('block', text)
    var tryParseBlock = function(text) { return () => {parseBlock(text)} }
    
    it('block', function() {
        var block = parseBlock('[]')
        expect(block).blockNode([])
    })
    
    it('block error', function() {
        //expect(tryParseExpression('42 selector_with_underscore')).toThrowError(SyntaxError)
    });

});