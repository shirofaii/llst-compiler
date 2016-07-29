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
        expect(parseNumber('123')).node('number')
        expect(parseNumber('123')).nodeWithValue(123)
        expect(parseNumber('0000')).nodeWithValue(0)
        expect(parseNumber('-2')).nodeWithValue(-2)
        expect(parseNumber('+2')).nodeWithValue(2)
        expect(parseNumber('+0')).nodeWithValue(0)
        expect(parseNumber('-0')).nodeWithValue(0)
        expect(parseNumber('02')).nodeWithValue(2)
        expect(parseNumber('1267650600228229401496703205376')).nodeWithValue(Math.pow(2, 100))
        
        expect(tryParseNumber('+-1')).toThrowError(SyntaxError)
        expect(tryParseNumber('1+')).toThrowError(SyntaxError)
        expect(tryParseNumber('1a')).toThrowError(SyntaxError)
        expect(tryParseNumber('')).toThrowError(SyntaxError)
        expect(tryParseNumber('-')).toThrowError(SyntaxError)
    });
    
    it('floats', function() {
        expect(parseNumber('123.0')).node('number')
        expect(parseNumber('123.0')).nodeWithValue(123.0)
        expect(parseNumber('0000.0000')).nodeWithValue(0)
        expect(parseNumber('-2.1')).nodeWithValue(-2.1)
        expect(parseNumber('+2.1')).nodeWithValue(2.1)
        expect(parseNumber('+0.0')).nodeWithValue(0)
        expect(parseNumber('-0.0')).nodeWithValue(0)
        expect(parseNumber('02.20')).nodeWithValue(2.2)
        expect(parseNumber('0.01010')).nodeWithValue(0.01010)
        
        expect(tryParseNumber('1.')).toThrowError(SyntaxError)
        expect(tryParseNumber('.1')).toThrowError(SyntaxError)
        expect(tryParseNumber('.')).toThrowError(SyntaxError)
    });

    it('string', function() {
        expect(parseString("'123'")).node('string')
        expect(parseString("'123'")).nodeWithValue('123')
        expect(parseString("''")).nodeWithValue('')
        expect(parseString("' '")).nodeWithValue(' ')
        expect(parseString("'abc'")).nodeWithValue('abc')
        expect(parseString("' 1aBC'")).nodeWithValue(' 1aBC')
        expect(parseString("'Testing «ταБЬℓσ»: 1<2 & 4+1>3, now 20% off!'")).nodeWithValue('Testing «ταБЬℓσ»: 1<2 & 4+1>3, now 20% off!')
        expect(parseString("''''")).nodeWithValue("\'")
        expect(parseString("'\"'")).nodeWithValue("\"")
        expect(parseString("'\\\"'")).nodeWithValue("\\\"")
        
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
        expect(parseSymbol("#123")).node('symbol')
        expect(parseSymbol("#123")).nodeWithValue('123')
        expect(parseSymbol("#''")).nodeWithValue('')
        expect(parseSymbol("#' '")).nodeWithValue(' ')
        expect(parseSymbol("#'abc'")).nodeWithValue('abc')
        expect(parseSymbol("#abc")).nodeWithValue('abc')
        expect(parseSymbol("#' 1aBC'")).nodeWithValue(' 1aBC')
        expect(parseSymbol("#'Testing «ταБЬℓσ»: 1<2 & 4+1>3, now 20% off!'")).nodeWithValue('Testing «ταБЬℓσ»: 1<2 & 4+1>3, now 20% off!')
        expect(parseSymbol("#''''")).nodeWithValue("\'")
        expect(parseSymbol("#'\"'")).nodeWithValue("\"")
        expect(parseSymbol("#'#'")).nodeWithValue("#")
        
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
        expect(parseChar("$1")).node('character')
        expect(parseChar("$1")).nodeWithValue('1')
        expect(parseChar("$a")).nodeWithValue('a')
        expect(parseChar("$A")).nodeWithValue('A')
        expect(parseChar("$$")).nodeWithValue('$')
        expect(parseChar("$\'")).nodeWithValue('\'')
        expect(parseChar("$\"")).nodeWithValue('\"')
        expect(parseChar("$Б")).nodeWithValue('Б')
        expect(parseChar("$ ")).nodeWithValue(' ')
        expect(parseChar("$\t")).nodeWithValue("\t")
        expect(parseChar("$^")).nodeWithValue("^")
        
        expect(tryParseChar("$")).toThrowError(SyntaxError)
        expect(tryParseChar("$\n")).toThrowError(SyntaxError)
        expect(tryParseChar("$\r")).toThrowError(SyntaxError)
        expect(tryParseChar("$\0")).toThrowError(SyntaxError)
    })

    it('pseudoVariable', function() {
        expect(parseBool("true")).node('bool')
        expect(parseBool("true")).nodeWithValue(true)
        expect(parseBool("false")).nodeWithValue(false)
        expect(parseBool("nil")).nodeWithValue(null)
        
        expect(tryParseBool("null")).toThrowError(SyntaxError)
        expect(tryParseBool("")).toThrowError(SyntaxError)
        expect(tryParseBool("self")).toThrowError(SyntaxError)
        expect(tryParseBool("super")).toThrowError(SyntaxError)
        expect(tryParseBool("True")).toThrowError(SyntaxError)
    })
    
    //array
    it('literalArray', function() {
        var array = parseArray("#()")
        expect(array).node('literalArray')
        expect(array.nodes.length).toBe(0)
    })
    it('literalArray', function() {
        var array = parseArray("#(12)")
        expect(array.nodes.length).toBe(1)
        expect(array.nodes[0]).node('number')
        expect(array.nodes[0]).nodeWithValue(12)
    })
    it('literalArray', function() {
        var array = parseArray("#( 12.2 )")
        expect(array.nodes.length).toBe(1)
        expect(array.nodes[0]).node('number')
        expect(array.nodes[0]).nodeWithValue(12.2)
    })
    it('literalArray', function() {
        var array = parseArray("#( 'nil' #nil $) nil \"nil\" )")
        expect(array.nodes.length).toBe(4)
        
        expect(array.nodes[0]).node('string')
        expect(array.nodes[0]).nodeWithValue('nil')
        
        expect(array.nodes[1]).node('symbol')
        expect(array.nodes[1]).nodeWithValue('nil')
        
        expect(array.nodes[2]).node('character')
        expect(array.nodes[2]).nodeWithValue(')')
        
        expect(array.nodes[3]).node('bool')
        expect(array.nodes[3]).nodeWithValue(null)
    })
    it('literalArray', function() {
        var array = parseArray("#( #( #(1 2 3) ) #() )")
        expect(array.nodes.length).toBe(2)
        
        expect(array.nodes[0]).node('literalArray')
        expect(array.nodes[0].nodes.length).toBe(1)
        expect(array.nodes[0].nodes[0].nodes.length).toBe(3)
        
        expect(array.nodes[1]).node('literalArray')
        expect(array.nodes[1].nodes.length).toBe(0)
    })
    it('literalArray', function() {
        var array = parseArray("#(abc (1 2 3))")
        expect(array.nodes.length).toBe(2)
        
        expect(array.nodes[0]).nodeWithValue('abc')
        expect(array.nodes[1].nodes.length).toBe(3)
        expect(array.nodes[1].nodes[0]).nodeWithValue(1)
        expect(array.nodes[1].nodes[1]).nodeWithValue(2)
        expect(array.nodes[1].nodes[2]).nodeWithValue(3)
    })
    it('literalArray', function() {
        var array = parseArray("#($ a123 123a [^42.] self)")
        expect(array.nodes.length).toBe(6)
        
        expect(array.nodes[0]).node('character')
        expect(array.nodes[0]).nodeWithValue(' ')
        expect(array.nodes[1]).node('symbol')
        expect(array.nodes[1]).nodeWithValue('a123')
        expect(array.nodes[2]).node('number')
        expect(array.nodes[2]).nodeWithValue(123)
        expect(array.nodes[3]).node('symbol')
        expect(array.nodes[3]).nodeWithValue('a')
        expect(array.nodes[4]).node('symbol')
        expect(array.nodes[4]).nodeWithValue('[^42.]')
        expect(array.nodes[5]).node('symbol')
        expect(array.nodes[5]).nodeWithValue('self')
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