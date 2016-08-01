const parser = require('../../build/llst-method.js')
const SyntaxError = parser.SyntaxError

function parse(rule, text) {
    return parser.parse(text, {startRule: rule})
}

describe('llst expression grammar', function() {
    var parseExpression = text => parse('expression', text)
    var tryParseExpression = function(text) { return () => {parseExpression(text)} }
    
    it('unary message', function() {
        var msg = parseExpression('42factorial')
        expect(msg).sendNode({
            selector: 'factorial',
            receiver: {type: 'number', value: 42}
        })
    });
    it('unary message', function() {
        var msg = parseExpression('self  resetSignal ')
        expect(msg).sendNode({
            receiver: {type: 'variable', value: 'self'},
            selector: 'resetSignal'
        })
    });
    it('unary message', function() {
        var msg = parseExpression('(\'str\' add10Whitespaces)')
        expect(msg).sendNode({
            receiver: {type: 'string', value: 'str'},
            selector: 'add10Whitespaces'
        })
    });
    it('unary message', function() {
        var msg = parseExpression('Integer class name')
        expect(msg).sendNode({
            receiver: {
                type: 'send',
                receiver: {type: 'classReference', value: 'Integer'},
                selector: 'class'
            },
            selector: 'name'
        })
    });
    
    it('binary message', function() {
        var msg = parseExpression('3+4')
        expect(msg).sendNode({
            receiver: {type: 'number', value: 3},
            selector: '+',
            arguments: [{type: 'number', value: 4}]
        })
    });
    it('binary message', function() {
        var msg = parseExpression('self >=#abv')
        expect(msg).sendNode({
            receiver: {type: 'variable', value:  'self'},
            selector: '>=',
            arguments: [{type: 'symbol', value: 'abv'}]
        })
    });
    it('binary message', function() {
        var msg = parseExpression('cout << #test << String eol')
        expect(msg).sendNode({
            receiver: {
                type: 'send',
                receiver: {type: 'variable', value: 'cout'},
                selector: '<<',
                arguments: [{type: 'symbol', value: 'test'}]
            },
            selector: '<<',
            arguments: [{
                type: 'send',
                receiver: {type: 'classReference', value: 'String'},
                selector: 'eol'
            }]
        })
    });
    
    it('keyword message', function() {
        var msg = parseExpression('1 to: 10')
        expect(msg).sendNode({
            receiver: {type: 'number', value: 1},
            selector: 'to:',
            arguments: [{type: 'number', value: 10}]
        })
    })
    it('keyword message', function() {
        var msg = parseExpression('10 to:1 by:-1')
        expect(msg).sendNode({
            receiver: {type: 'number', value: 10},
            selector: 'to:by:',
            arguments: [{type: 'number', value: 1}, {type: 'number', value: -1}]
        })
    })
    it('keyword message', function() {
        var msg = parseExpression('(1 to: 10) do: aBlock')
        expect(msg).sendNode({
            receiver: {
                type: 'send',
                receiver: {type: 'number', value: 1},
                selector: 'to:',
                arguments: [{type: 'number', value: 10}]
            },
            selector: 'do:',
            arguments: [{type: 'variable', value: 'aBlock'}]
        })
    })
    
    it('cascade message', function() {
        var msg = parseExpression('self a; b;\n c')
        expect(msg).node({
            type: 'cascade',
            receiver: {type: 'variable', value: 'self'},
            nodes: [
                {type: 'send', selector: 'a'},
                {type: 'send', selector: 'b'},
                {type: 'send', selector: 'c'}
            ]
        })
    })
    it('cascade message', function() {
        var msg = parseExpression('self + 2;- 2;c')
        expect(msg).node({
            type: 'cascade',
            receiver: {type: 'variable', value: 'self'},
            nodes: [
                {type: 'send', selector: '+', arguments: [{type: 'number', value: 2}]},
                {type: 'send', selector: '-', arguments: [{type: 'number', value: 2}]},
                {type: 'send', selector: 'c'}
            ]
        })
    })
    it('cascade message', function() {
        var msg = parseExpression('a load:(3+4);yourself')
        expect(msg).node({
            type: 'cascade',
            receiver: {type: 'variable', value: 'a'},
            nodes: [
                {type: 'send', selector: 'load:', arguments: [{
                    type: 'send',
                    receiver: {type: 'number', value: 3},
                    selector: '+',
                    arguments: [{type: 'number', value: 4}]
                }]},
                {type: 'send', selector: 'yourself'}
            ]
        })
    })

    
    it('unary message error', function() {
        expect(tryParseExpression('42 selector_with_underscore')).toThrowError(SyntaxError)
        expect(tryParseExpression('42 +')).toThrowError(SyntaxError)
    });
    it('binary message error', function() {
        expect(tryParseExpression('2 _ 3')).toThrowError(SyntaxError)
        expect(tryParseExpression('2 ! 3')).toThrowError(SyntaxError)
        expect(tryParseExpression('2 ` 3')).toThrowError(SyntaxError)
        expect(tryParseExpression('2 ^ 3')).toThrowError(SyntaxError)
        expect(tryParseExpression('2 ∊ #(1 2 3)')).toThrowError(SyntaxError)
    });
    it('keyword message error', function() {
        expect(tryParseExpression('2to::2')).toThrowError(SyntaxError)
        expect(tryParseExpression('2 to@: 2')).toThrowError(SyntaxError)
        expect(tryParseExpression('2 to 2')).toThrowError(SyntaxError)
        expect(tryParseExpression('2 ro:')).toThrowError(SyntaxError)
        expect(tryParseExpression('1 a_b: 2')).toThrowError(SyntaxError)
    });
    it('cascade message error', function() {
        expect(tryParseExpression('test;')).toThrowError(SyntaxError)
        expect(tryParseExpression('test a;')).toThrowError(SyntaxError)
        expect(tryParseExpression(';')).toThrowError(SyntaxError)
        expect(tryParseExpression('test a;;')).toThrowError(SyntaxError)
    });

});