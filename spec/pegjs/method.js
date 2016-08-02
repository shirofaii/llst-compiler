const parser = require('../../build/llst-method.js')
const SyntaxError = parser.SyntaxError

function parse(rule, text) {
    return parser.parse(text, {startRule: rule})
}

describe('llst method grammar', function() {
    var parseMethod = text => parse('method', text)
    var tryParseMethod = function(text) { return () => {parseMethod(text)} }
    
    it('method', function() {
        var method = parseMethod(`
            asNumber | val |
            	" parse a base-10 ASCII number, return nil on failure "
            	val <- 0.
            	self do: [:c|
            		c isDigit ifFalse: [^nil].
            		val <- (val * 10) + (c value - 48)
            	].
            	^val
        `)
        expect(method).methodNode('asNumber', [], ['val'], [
            {type: 'assignment', left: {type: 'variable', value: 'val'}, right: {type: 'number', value: 0}},
            {type: 'send',
                receiver: {type: 'variable', value: 'self'},
                selector: 'do:',
                arguments: [{type: 'block', arguments: ['c'], body: { type: 'sequence', temps: [], sequence: [
                    {
                        type: 'send',
                        receiver: {
                            type: 'send',
                            receiver: {type: 'variable', value: 'c'},
                            selector: 'isDigit'
                        },
                        selector: 'ifFalse:',
                        arguments: [{type: 'block', body: {temps: [], sequence: [{type: 'return', value: {type: 'variable', value: 'nil'}}]}}]
                    },
                    {
                        type: 'assignment',
                        left: {type: 'variable', value: 'val'},
                        right: {
                            type: 'send',
                            receiver: {
                                type: 'send',
                                receiver: {type: 'variable', value: 'val'},
                                selector: '*',
                                arguments: [{type: 'number', value: 10}]
                            },
                            selector: '+',
                            arguments: [{
                                type: 'send',
                                receiver: {
                                    type: 'send',
                                    receiver: {type: 'variable', value: 'c'},
                                    selector: 'value'
                                },
                                selector: '-',
                                arguments: [{type: 'number', value: 48}]
                            }]
                        }
                    }
                ]}}]
            },
            {type: 'return', value: {type: 'variable', value: 'val'}}
        ])
    })

    it('method error', function() {
    });

});