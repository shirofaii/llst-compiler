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
    it('block', function() {
        var block = parseBlock('[^42]')
        expect(block).blockNode([{
            type: 'return', value: {
                type: 'number', value: 42
            }
        }])
    })
    it('block', function() {
        var block = parseBlock('[3 + 4]')
        expect(block).blockNode([{
            type: 'send',
            receiver: {type: 'number', value: 3},
            selector: '+',
            arguments: [{type: 'number', value: 4}]
        }])
    })
    it('block', function() {
        var block = parseBlock('[:x| |y| x|2]')
        expect(block).blockNode([{
            type: 'send',
            receiver: {type: 'variable', value: 'x'},
            selector: '|',
            arguments: [{type: 'number', value: 2}]
        }], ['x'], ['y'])
    })
    
    it('block', function() {
        var block = parseBlock('[:a:b| a.b]')
        expect(block).blockNode([{
            type: 'variable', value: 'a'
        }, {
            type: 'variable', value: 'b'
        }], ['a', 'b'], [])
    })

    it('block', function() {
        var block = parseBlock('[|x| [x]]')
        expect(block).blockNode([{
            type: 'block',
            body: {
                temps: [],
                statements: [{type: 'variable', value: 'x'}]
            },
            arguments: []
        }], [], ['x'])
    })
    it('block', function() {
        var block = parseBlock('[||x||2]')
        expect(block).blockNode([{
            type: 'send',
            receiver: {type: 'variable', value: 'x'},
            selector: '||',
            arguments: [{type: 'number', value: 2}]
        }], [], [])
    })

    it('block error', function() {
        expect(tryParseBlock('[|]')).toThrowError(SyntaxError)
        expect(tryParseBlock('[:a]')).toThrowError(SyntaxError)
        expect(tryParseBlock('[[]')).toThrowError(SyntaxError)
    });

});