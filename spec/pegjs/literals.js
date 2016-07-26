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
        
        expect(tryParseNumber("abc")).toThrowError(SyntaxError)
        expect(tryParseNumber("\"abc\"")).toThrowError(SyntaxError)
        expect(tryParseNumber("'abc")).toThrowError(SyntaxError)
        expect(tryParseNumber("a'bc")).toThrowError(SyntaxError)
        expect(tryParseNumber("a'bc'")).toThrowError(SyntaxError)
        expect(tryParseNumber("abc'")).toThrowError(SyntaxError)
        expect(tryParseNumber("'''")).toThrowError(SyntaxError)
    })
    
    
});