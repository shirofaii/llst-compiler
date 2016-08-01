const parser = require('../../build/llst-method.js')
const SyntaxError = parser.SyntaxError

function parse(rule, text) {
    return parser.parse(text, {startRule: rule})
}

describe('llst literals grammar', function() {
    var parseNumber = text => parse('number', text)
    var tryParseNumber = function(text) { return () => {parseNumber(text)} }
    
    var parseString = text => parse('string', text)
    var tryParseString = function(text) { return () => {parseString(text)} }
    
    var parseSymbol = text => parse('symbol', text)
    var tryParseSymbol = function(text) { return () => {parseSymbol(text)} }
    
    var parseChar = text => parse('character', text)
    var tryParseChar = function(text) { return () => {parseChar(text)} }
    
    var parseBool = text => parse('pseudoVariable', text)
    var tryParseBool = function(text) { return () => {parseBool(text)} }

    var parseArray = text => parse('literalArray', text)
    var tryParseArray = function(text) { return () => {parseArray(text)} }

    it('integers', function() {
        expect(parseNumber('123')).literalNode('number', 123)
        expect(parseNumber('0000')).literalNode('number', 0)
        expect(parseNumber('-2')).literalNode('number', -2)
        expect(parseNumber('+2')).literalNode('number', 2)
        expect(parseNumber('+0')).literalNode('number', 0)
        expect(parseNumber('-0')).literalNode('number', 0)
        expect(parseNumber('02')).literalNode('number', 2)
        expect(parseNumber('1267650600228229401496703205376')).literalNode('number', Math.pow(2, 100))
        
        expect(tryParseNumber('+-1')).toThrowError(SyntaxError)
        expect(tryParseNumber('1+')).toThrowError(SyntaxError)
        expect(tryParseNumber('1a')).toThrowError(SyntaxError)
        expect(tryParseNumber('')).toThrowError(SyntaxError)
        expect(tryParseNumber('-')).toThrowError(SyntaxError)
    });
    
    it('floats', function() {
        expect(parseNumber('123.0')).literalNode('number', 123.0)
        expect(parseNumber('0000.0000')).literalNode('number',0)
        expect(parseNumber('-2.1')).literalNode('number',-2.1)
        expect(parseNumber('+2.1')).literalNode('number',2.1)
        expect(parseNumber('+0.0')).literalNode('number',0)
        expect(parseNumber('-0.0')).literalNode('number',0)
        expect(parseNumber('02.20')).literalNode('number',2.2)
        expect(parseNumber('0.01010')).literalNode('number',0.01010)
        
        expect(tryParseNumber('1.')).toThrowError(SyntaxError)
        expect(tryParseNumber('.1')).toThrowError(SyntaxError)
        expect(tryParseNumber('.')).toThrowError(SyntaxError)
    });

    it('string', function() {
        expect(parseString("'123'")).literalNode('string','123')
        expect(parseString("''")).literalNode('string','')
        expect(parseString("' '")).literalNode('string',' ')
        expect(parseString("'abc'")).literalNode('string','abc')
        expect(parseString("' 1aBC'")).literalNode('string',' 1aBC')
        expect(parseString("'Testing «ταБЬℓσ»: 1<2 & 4+1>3, now 20% off!'")).literalNode('string','Testing «ταБЬℓσ»: 1<2 & 4+1>3, now 20% off!')
        expect(parseString("''''")).literalNode('string',"\'")
        expect(parseString("'\"'")).literalNode('string',"\"")
        expect(parseString("'\\\"'")).literalNode('string',"\\\"")
        
        expect(tryParseString("abc")).toThrowError(SyntaxError)
        expect(tryParseString("\"abc\"")).toThrowError(SyntaxError)
        expect(tryParseString("'abc")).toThrowError(SyntaxError)
        expect(tryParseString("a'bc")).toThrowError(SyntaxError)
        expect(tryParseString("a'bc'")).toThrowError(SyntaxError)
        expect(tryParseString("abc'")).toThrowError(SyntaxError)
        expect(tryParseString("'''")).toThrowError(SyntaxError)
        expect(tryParseString("")).toThrowError(SyntaxError)
        expect(tryParseString("'")).toThrowError(SyntaxError)
    })
    
    it('symbol', function() {
        expect(parseSymbol("#123")).literalNode('symbol')
        expect(parseSymbol("#123")).literalNode('symbol','123')
        expect(parseSymbol("#''")).literalNode('symbol','')
        expect(parseSymbol("#' '")).literalNode('symbol',' ')
        expect(parseSymbol("#'abc'")).literalNode('symbol','abc')
        expect(parseSymbol("#abc")).literalNode('symbol','abc')
        expect(parseSymbol("#' 1aBC'")).literalNode('symbol',' 1aBC')
        expect(parseSymbol("#'Testing «ταБЬℓσ»: 1<2 & 4+1>3, now 20% off!'")).literalNode('symbol','Testing «ταБЬℓσ»: 1<2 & 4+1>3, now 20% off!')
        expect(parseSymbol("#''''")).literalNode('symbol',"\'")
        expect(parseSymbol("#'\"'")).literalNode('symbol',"\"")
        expect(parseSymbol("#'#'")).literalNode('symbol',"#")
        
        expect(tryParseSymbol("#ab c")).toThrowError(SyntaxError)
        expect(tryParseSymbol("#\"abc\"")).toThrowError(SyntaxError)
        expect(tryParseSymbol("#'abc")).toThrowError(SyntaxError)
        expect(tryParseSymbol("#a'bc")).toThrowError(SyntaxError)
        expect(tryParseSymbol("#a'bc'")).toThrowError(SyntaxError)
        expect(tryParseSymbol("#abc'")).toThrowError(SyntaxError)
        expect(tryParseSymbol("#'''")).toThrowError(SyntaxError)
        expect(tryParseSymbol("#")).toThrowError(SyntaxError)
        expect(tryParseSymbol("##")).toThrowError(SyntaxError)
        expect(tryParseSymbol("# ")).toThrowError(SyntaxError)
        expect(tryParseSymbol("#()")).toThrowError(SyntaxError)
        expect(tryParseSymbol("#(")).toThrowError(SyntaxError)
    })

    it('character', function() {
        expect(parseChar("$1")).literalNode('character')
        expect(parseChar("$1")).literalNode('character','1')
        expect(parseChar("$a")).literalNode('character','a')
        expect(parseChar("$A")).literalNode('character','A')
        expect(parseChar("$$")).literalNode('character','$')
        expect(parseChar("$\'")).literalNode('character','\'')
        expect(parseChar("$\"")).literalNode('character','\"')
        expect(parseChar("$Б")).literalNode('character','Б')
        expect(parseChar("$ ")).literalNode('character',' ')
        expect(parseChar("$\t")).literalNode('character',"\t")
        expect(parseChar("$^")).literalNode('character',"^")
        
        expect(tryParseChar("$")).toThrowError(SyntaxError)
        expect(tryParseChar("$\n")).toThrowError(SyntaxError)
        expect(tryParseChar("$\r")).toThrowError(SyntaxError)
        expect(tryParseChar("$\0")).toThrowError(SyntaxError)
    })

    it('pseudoVariable', function() {
        expect(parseBool("true")).literalNode('bool')
        expect(parseBool("true")).literalNode('bool',true)
        expect(parseBool("false")).literalNode('bool',false)
        expect(parseBool("nil")).literalNode('bool',null)
        
        expect(tryParseBool("null")).toThrowError(SyntaxError)
        expect(tryParseBool("")).toThrowError(SyntaxError)
        expect(tryParseBool("self")).toThrowError(SyntaxError)
        expect(tryParseBool("super")).toThrowError(SyntaxError)
        expect(tryParseBool("True")).toThrowError(SyntaxError)
    })
    
    //array
    it('literalArray', function() {
        var array = parseArray("#()")
        expect(array).literalNode('literalArray')
        expect(array.nodes.length).toBe(0)
    })
    it('literalArray', function() {
        var array = parseArray("#(12)")
        expect(array.nodes.length).toBe(1)
        expect(array.nodes[0]).literalNode('number', 12)
    })
    it('literalArray', function() {
        var array = parseArray("#( 12.2 )")
        expect(array.nodes.length).toBe(1)
        expect(array.nodes[0]).literalNode('number', 12.2)
    })
    it('literalArray', function() {
        var array = parseArray("#( 'nil' #nil $) nil \"nil\" )")
        expect(array.nodes.length).toBe(4)
        
        expect(array.nodes[0]).literalNode('string', 'nil')
        
        expect(array.nodes[1]).literalNode('symbol', 'nil')
        
        expect(array.nodes[2]).literalNode('character', ')')
        
        expect(array.nodes[3]).literalNode('bool', null)
    })
    it('literalArray', function() {
        var array = parseArray("#( #( #(1 2 3) ) #() )")
        expect(array.nodes.length).toBe(2)
        
        expect(array.nodes[0]).literalNode('literalArray')
        expect(array.nodes[0].nodes.length).toBe(1)
        expect(array.nodes[0].nodes[0].nodes.length).toBe(3)
        
        expect(array.nodes[1]).literalNode('literalArray')
        expect(array.nodes[1].nodes.length).toBe(0)
    })
    it('literalArray', function() {
        var array = parseArray("#(abc (1 2 3))")
        expect(array.nodes.length).toBe(2)
        
        expect(array.nodes[0]).literalNode('symbol', 'abc')
        expect(array.nodes[1].nodes.length).toBe(3)
        expect(array.nodes[1].nodes[0]).literalNode('number', 1)
        expect(array.nodes[1].nodes[1]).literalNode('number', 2)
        expect(array.nodes[1].nodes[2]).literalNode('number', 3)
    })
    it('literalArray', function() {
        var array = parseArray("#($ a123 123a [^42.] self)")
        expect(array.nodes.length).toBe(6)
        
        expect(array.nodes[0]).literalNode('character', ' ')
        expect(array.nodes[1]).literalNode('symbol', 'a123')
        expect(array.nodes[2]).literalNode('number', 123)
        expect(array.nodes[3]).literalNode('symbol', 'a')
        expect(array.nodes[4]).literalNode('symbol', '[^42.]')
        expect(array.nodes[5]).literalNode('symbol', 'self')
    })
    
    it('literalArrayErrors', function() {
        expect(tryParseArray("#(")).toThrowError(SyntaxError)
        expect(tryParseArray("")).toThrowError(SyntaxError)
        expect(tryParseArray("()")).toThrowError(SyntaxError)
        expect(tryParseArray("#(#)")).toThrowError(SyntaxError)
        expect(tryParseArray("#($)")).toThrowError(SyntaxError)
        expect(tryParseArray("#(')")).toThrowError(SyntaxError)
        expect(tryParseArray("#(()")).toThrowError(SyntaxError)
        expect(tryParseArray("#())")).toThrowError(SyntaxError)
        expect(tryParseArray("#(#\nabv)")).toThrowError(SyntaxError)
        expect(tryParseArray("#($\n)")).toThrowError(SyntaxError)
    })

});